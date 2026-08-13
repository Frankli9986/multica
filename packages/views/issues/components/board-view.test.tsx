/**
 * @vitest-environment jsdom
 *
 * BoardView DOM integration for the right-drag pan + deferred context-menu
 * suppression (WS-226 v3 / WS-227). Verifies the two behaviors a hook-only
 * test cannot: that after an actual pan a card's IssueActionsContextMenu does
 * NOT open, and that a stationary right-click on a card DOES restore it.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { BoardView } from "./board-view";
import { IssueContextMenuProvider } from "../actions";
import { setApiInstance } from "@multica/core/api";
import type { ApiClient } from "@multica/core/api/client";
import type { Issue } from "@multica/core/types";
import { I18nProvider } from "@multica/core/i18n/react";
import enCommon from "../../locales/en/common.json";
import enIssues from "../../locales/en/issues.json";

const TEST_RESOURCES = { en: { common: enCommon, issues: enIssues } };

vi.mock("@multica/core/hooks", () => ({
  useWorkspaceId: () => "ws-1",
}));

vi.mock("@multica/core/paths", async () => {
  const actual = await vi.importActual<typeof import("@multica/core/paths")>(
    "@multica/core/paths",
  );
  return {
    ...actual,
    useWorkspaceSlug: () => "acme",
    useRequiredWorkspaceSlug: () => "acme",
    useWorkspacePaths: () => actual.paths.workspace("acme"),
  };
});

const mockAuthUser = { id: "user-1", email: "test@test.com", name: "Test User" };
vi.mock("@multica/core/auth", () => ({
  useAuthStore: Object.assign(
    (selector?: any) => {
      const state = { user: mockAuthUser, isAuthenticated: true };
      return selector ? selector(state) : state;
    },
    { getState: () => ({ user: mockAuthUser, isAuthenticated: true }) },
  ),
  registerAuthStore: vi.fn(),
  createAuthStore: vi.fn(),
}));

vi.mock("../../navigation", () => ({
  AppLink: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
  useNavigation: () => ({
    push: vi.fn(),
    pathname: "/issues",
    searchParams: new URLSearchParams(),
    back: vi.fn(),
    replace: vi.fn(),
    getShareableUrl: (p: string) => `https://app.example${p}`,
  }),
  resolveClickIntent: () => "push",
  useIntentNavigate: () => () => {},
  NavigationProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("@multica/core/issues/config", () => ({
  ALL_STATUSES: ["backlog", "todo", "in_progress", "in_review", "done", "blocked", "cancelled"],
  STATUS_ORDER: ["backlog", "todo", "in_progress", "in_review", "done", "blocked", "cancelled"],
  STATUS_CONFIG: {
    backlog: { label: "Backlog", iconColor: "text-muted-foreground", hoverBg: "hover:bg-accent" },
    todo: { label: "Todo", iconColor: "text-muted-foreground", hoverBg: "hover:bg-accent" },
    in_progress: { label: "In Progress", iconColor: "text-warning", hoverBg: "hover:bg-warning/10" },
    in_review: { label: "In Review", iconColor: "text-success", hoverBg: "hover:bg-success/10" },
    done: { label: "Done", iconColor: "text-info", hoverBg: "hover:bg-info/10" },
    blocked: { label: "Blocked", iconColor: "text-destructive", hoverBg: "hover:bg-destructive/10" },
    cancelled: { label: "Cancelled", iconColor: "text-muted-foreground", hoverBg: "hover:bg-accent" },
  },
  PRIORITY_ORDER: ["urgent", "high", "medium", "low", "none"],
  PRIORITY_DISPLAY_ORDER: ["none", "urgent", "high", "medium", "low"],
  PRIORITY_CONFIG: {
    urgent: { label: "Urgent", bars: 4, color: "text-destructive" },
    high: { label: "High", bars: 3, color: "text-warning" },
    medium: { label: "Medium", bars: 2, color: "text-warning" },
    low: { label: "Low", bars: 1, color: "text-info" },
    none: { label: "No priority", bars: 0, color: "text-muted-foreground" },
  },
}));

const mockViewState: Record<string, unknown> = {
  grouping: "status",
  sortBy: "position",
  sortDirection: "asc",
  cardProperties: { priority: true, assignee: true, dueDate: true, project: true, childProgress: true, labels: true },
  cardPropertyIds: [],
  swimlaneGrouping: "assignee",
  swimlaneOrders: { parent: [], project: [], assignee: [] },
  collapsedSwimlanes: { parent: [], project: [], assignee: [] },
  setSwimlaneGrouping: vi.fn(),
  setSwimlaneOrder: vi.fn(),
  toggleSwimlaneCollapsed: vi.fn(),
  hideStatus: vi.fn(),
  showStatus: vi.fn(),
  priorityFilters: [],
  assigneeFilters: [],
  includeNoAssignee: false,
  creatorFilters: [],
  projectFilters: [],
  includeNoProject: false,
  labelFilters: [],
  propertyFilters: {},
  agentRunningFilter: false,
};
vi.mock("@multica/core/issues/stores/view-store-context", () => ({
  ViewStoreProvider: ({ children }: { children: ReactNode }) => children,
  useViewStore: (selector?: any) => (selector ? selector(mockViewState) : mockViewState),
  useViewStoreApi: () => ({ getState: () => mockViewState, setState: vi.fn(), subscribe: vi.fn() }),
}));

vi.mock("@multica/core/modals", () => ({
  useModalStore: Object.assign(
    () => ({ open: vi.fn() }),
    { getState: () => ({ open: vi.fn() }) },
  ),
}));

vi.mock("@multica/core/pins", () => ({
  pinListOptions: () => ({
    queryKey: ["pins", "ws-1", "user-1"],
    queryFn: () => Promise.resolve([]),
  }),
  useCreatePin: () => ({ mutate: vi.fn() }),
  useDeletePin: () => ({ mutate: vi.fn() }),
}));

vi.mock("@multica/core/issues/mutations", () => ({
  useUpdateIssue: () => ({ mutate: vi.fn() }),
}));

vi.mock("@multica/core/properties", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@multica/core/properties")>();
  return {
    ...actual,
    useSetIssueProperty: () => ({ mutate: vi.fn(), mutateAsync: vi.fn() }),
    useUnsetIssueProperty: () => ({ mutate: vi.fn(), mutateAsync: vi.fn() }),
  };
});

vi.mock("@multica/core/workspace/queries", () => ({
  memberListOptions: () => ({
    queryKey: ["workspaces", "ws-1", "members"],
    queryFn: () => Promise.resolve([]),
  }),
  agentListOptions: () => ({
    queryKey: ["workspaces", "ws-1", "agents"],
    queryFn: () => Promise.resolve([]),
  }),
  squadListOptions: () => ({
    queryKey: ["workspaces", "ws-1", "squads"],
    queryFn: () => Promise.resolve([]),
  }),
  assigneeFrequencyOptions: () => ({
    queryKey: ["workspaces", "ws-1", "assignee-frequency"],
    queryFn: () => Promise.resolve([]),
  }),
}));

const { mockActorNameResult } = vi.hoisted(() => ({
  mockActorNameResult: {
    getActorName: (_type: string, _id: string) => "Mock Actor",
    getActorInitials: () => "MA",
    getActorAvatarUrl: () => null,
    getMemberName: () => "Mock Member",
    getAgentName: () => "Mock Agent",
    getSquadName: () => "Mock Squad",
  },
}));
vi.mock("@multica/core/workspace/hooks", () => ({
  useActorName: () => mockActorNameResult,
}));

vi.mock("@dnd-kit/core", () => ({
  DndContext: ({ children }: any) => children,
  DragOverlay: () => null,
  PointerSensor: class {},
  useSensor: () => ({}),
  useSensors: () => [],
  useDroppable: () => ({ setNodeRef: vi.fn(), isOver: false }),
  pointerWithin: vi.fn(),
  closestCenter: vi.fn(),
}));

vi.mock("@dnd-kit/sortable", () => ({
  SortableContext: ({ children }: any) => children,
  verticalListSortingStrategy: {},
  arrayMove: <T,>(arr: T[]): T[] => arr.slice(),
  defaultAnimateLayoutChanges: () => false,
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
}));

vi.mock("@dnd-kit/utilities", () => ({
  CSS: { Transform: { toString: () => undefined } },
}));

vi.mock("react-virtuoso", () => ({
  Virtuoso: ({ data, itemContent, components }: any) => (
    <div data-testid="virtuoso-mock">
      {(data ?? []).map((item: any, i: number) => (
        <div key={i}>{itemContent(i, item)}</div>
      ))}
      {components?.Footer ? <components.Footer /> : null}
    </div>
  ),
  VirtuosoSeed: ({ data, itemContent, computeItemKey }: any) => (
    <div data-testid="virtuoso-seed-mock">
      {(data ?? []).map((item: any, i: number) => (
        <div key={computeItemKey(i, item) ?? i}>{itemContent(i, item)}</div>
      ))}
    </div>
  ),
}));

function makeIssue(overrides: Partial<Issue> & { id: string }): Issue {
  return {
    workspace_id: "ws-1",
    number: 1,
    identifier: `PROJ-${overrides.id}`,
    title: `Issue ${overrides.id}`,
    description: null,
    status: "todo",
    priority: "none",
    assignee_type: null,
    assignee_id: null,
    creator_type: "member",
    creator_id: "user-1",
    parent_issue_id: null,
    project_id: null,
    position: 100,
    stage: null,
    start_date: null,
    due_date: null,
    metadata: {},
    properties: {},
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function renderBoard(issues: Issue[]) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <I18nProvider resources={TEST_RESOURCES} locale="en">
        <IssueContextMenuProvider>
          <BoardView
            issues={issues}
            visibleStatuses={["todo", "in_progress", "done"]}
            hiddenStatuses={[]}
            onMoveIssue={vi.fn()}
          />
        </IssueContextMenuProvider>
      </I18nProvider>
    </QueryClientProvider>,
  );
}

// The board's horizontal scroller. jsdom has no layout, so scrollLeft is backed
// by a real value and clamped like the browser would; scrollTop is tracked so
// an accidental vertical write by the pan hook fails the test.
function findScroller(container: HTMLElement): HTMLDivElement & {
  __scrollTopWrites: number;
} {
  const scroller = container.querySelector<HTMLDivElement>(".overflow-x-auto");
  if (!scroller) throw new Error("board scroll container not found");
  let scrollLeft = 0;
  let scrollTop = 0;
  let scrollTopWrites = 0;
  Object.defineProperties(scroller, {
    scrollLeft: {
      configurable: true,
      get: () => scrollLeft,
      set: (value: number) => {
        scrollLeft = Math.min(Math.max(value, 0), 2000);
      },
    },
    scrollTop: {
      configurable: true,
      get: () => scrollTop,
      set: (value: number) => {
        scrollTopWrites += 1;
        scrollTop = Math.max(0, value);
      },
    },
    __scrollTopWrites: {
      configurable: true,
      get: () => scrollTopWrites,
    },
  });
  return scroller as HTMLDivElement & { __scrollTopWrites: number };
}

function pointer(opts: Record<string, unknown> = {}) {
  return {
    pointerId: 1,
    pointerType: "mouse",
    button: 2,
    clientX: 300,
    clientY: 100,
    ...opts,
  };
}

const cardMenuOpened = () =>
  document.querySelector<HTMLElement>("[data-popup-open]") !== null;

function findFirstCard(): HTMLElement {
  const card = document.querySelector<HTMLElement>(".group\\/card");
  if (!card) throw new Error("board card not found");
  return card;
}

describe("BoardView right-drag pan + deferred context menu", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockViewState.grouping = "status";
    setApiInstance({
      listProperties: () => Promise.resolve({ properties: [] }),
      listMembers: () => Promise.resolve([]),
      listAgents: () => Promise.resolve([]),
      listSquads: () => Promise.resolve([]),
      getAgentTaskSnapshot: () => Promise.resolve([]),
      listChildrenByParents: () => Promise.resolve({ issues: [] }),
      listProjects: () => Promise.resolve([]),
      getBaseUrl: () => "",
    } as unknown as ApiClient);
  });

  afterEach(() => {
    cleanup();
  });

  it("pans the board horizontally when right-dragging", async () => {
    const issues = [
      makeIssue({ id: "a1", title: "Board Card A" }),
      makeIssue({ id: "a2", title: "Board Card B", status: "in_progress" }),
    ];
    const { container } = renderBoard(issues);
    await screen.findByText("Board Card A");
    const scroller = findScroller(container);

    fireEvent.pointerDown(scroller, pointer({ clientX: 300 }));
    fireEvent.pointerMove(scroller, pointer({ clientX: 200 }));
    expect(scroller.scrollLeft).toBe(100);
    fireEvent.pointerMove(scroller, pointer({ clientX: 240 }));
    expect(scroller.scrollLeft).toBe(60);

    // Only the horizontal axis pans — scrollTop is never written.
    expect(scroller.scrollTop).toBe(0);
    expect(scroller.__scrollTopWrites).toBe(0);
  });

  it("does not hijack a left-button card drag (dnd-kit owns it)", async () => {
    const issues = [
      makeIssue({ id: "a1", title: "Board Card A" }),
      makeIssue({ id: "a2", title: "Board Card B", status: "in_progress" }),
    ];
    const { container } = renderBoard(issues);
    await screen.findByText("Board Card A");
    const scroller = findScroller(container);

    // A left-button drag is dnd-kit's contract: the pan hook must neither
    // scroll nor suppress/restore anything.
    fireEvent.pointerDown(scroller, pointer({ button: 0, clientX: 300 }));
    fireEvent.pointerMove(scroller, pointer({ button: 0, clientX: 200 }));
    fireEvent.pointerUp(scroller, pointer({ button: 0, clientX: 200 }));

    expect(scroller.scrollLeft).toBe(0);
    expect(scroller.scrollTop).toBe(0);
    expect(scroller.__scrollTopWrites).toBe(0);
    expect(cardMenuOpened()).toBe(false);
  });

  it("does not open a card menu after a pan that ends on a card", async () => {
    const issues = [
      makeIssue({ id: "a1", title: "Board Card A" }),
      makeIssue({ id: "a2", title: "Board Card B", status: "in_progress" }),
    ];
    const { container } = renderBoard(issues);
    await screen.findByText("Board Card A");
    const scroller = findScroller(container);

    fireEvent.pointerDown(scroller, pointer({ clientX: 300 }));
    fireEvent.pointerMove(scroller, pointer({ clientX: 150 }));
    // Release over a card's viewport position.
    fireEvent.pointerUp(scroller, pointer({ clientX: 150, clientY: 300 }));

    await waitFor(() => expect(scroller.scrollLeft).toBe(150));
    expect(cardMenuOpened()).toBe(false);
  });

  it("opens a card menu on a stationary right-click", async () => {
    const issues = [
      makeIssue({ id: "a1", title: "Board Card A" }),
      makeIssue({ id: "a2", title: "Board Card B", status: "in_progress" }),
    ];
    renderBoard(issues);
    await screen.findByText("Board Card A");
    const card = findFirstCard();

    // The restore path resolves the release target through elementFromPoint
    // (jsdom stubs it to null). Route it to the card so the deferred menu
    // reopens on the element under the cursor.
    const original = document.elementFromPoint;
    document.elementFromPoint = () => card as unknown as Element;

    try {
      // Stationary right-click over the card: pointerdown arms the gesture, the
      // contextmenu is suppressed (deferred), and pointerup without movement
      // restores the menu at the card.
      fireEvent.pointerDown(card, pointer({ clientX: 300, clientY: 300 }));
      fireEvent.contextMenu(card, pointer({ clientX: 300, clientY: 300 }));
      fireEvent.pointerUp(card, pointer({ clientX: 300, clientY: 300 }));

      // The card's IssueActionsContextMenu opens through the deferred restore.
      await waitFor(() => expect(cardMenuOpened()).toBe(true));
    } finally {
      document.elementFromPoint = original;
    }
  });

  it("does not restore any menu when releasing outside the board container", async () => {
    const issues = [
      makeIssue({ id: "a1", title: "Board Card A" }),
      makeIssue({ id: "a2", title: "Board Card B", status: "in_progress" }),
    ];
    const { container } = renderBoard(issues);
    await screen.findByText("Board Card A");
    const scroller = findScroller(container);
    const scrollerRef = container.querySelector<HTMLElement>(".overflow-x-auto")!;

    // Release point resolves to an element OUTSIDE the board scroller (e.g.
    // the sidebar) — the suppressed menu must not come back there.
    const original = document.elementFromPoint;
    document.elementFromPoint = () => {
      const outside = document.createElement("div");
      outside.dataset.outside = "1";
      document.body.appendChild(outside);
      return outside;
    };

    try {
      fireEvent.pointerDown(scroller, pointer({ clientX: 300, clientY: 300 }));
      fireEvent.contextMenu(scroller, pointer({ clientX: 300, clientY: 300 }));
      fireEvent.pointerUp(scroller, pointer({ clientX: 300, clientY: 300 }));

      expect(scrollerRef.contains(
        document.elementFromPoint(300, 300) as Element,
      )).toBe(false);
      expect(cardMenuOpened()).toBe(false);
    } finally {
      document.elementFromPoint = original;
      document.querySelector("[data-outside]")?.remove();
    }
  });

  it("keeps a plain right-click on a card working (no gesture)", async () => {
    const issues = [
      makeIssue({ id: "a1", title: "Board Card A" }),
      makeIssue({ id: "a2", title: "Board Card B", status: "in_progress" }),
    ];
    renderBoard(issues);
    await screen.findByText("Board Card A");
    const card = findFirstCard();

    // Without a pointer gesture (e.g. the context-menu key) the card's own
    // onContextMenu opens the menu directly.
    fireEvent.contextMenu(card, pointer({ clientX: 300, clientY: 300 }));

    await waitFor(() => expect(cardMenuOpened()).toBe(true));
  });
});
