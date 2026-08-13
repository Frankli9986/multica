/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { fireEvent, render, cleanup } from "@testing-library/react";
import { useRef } from "react";
import {
  useBoardRightDragPan,
  RIGHT_PAN_THRESHOLD_PX,
} from "./use-board-right-drag-pan";

/**
 * Minimal harness: a horizontally scrollable div with the hook's handlers
 * attached, plus a spy `onRestoreMenu`. jsdom has no layout, so scrollLeft is
 * backed by a real value and clamped like the browser does.
 */
function setup({
  scrollable = true,
  onRestoreMenu,
}: {
  scrollable?: boolean;
  onRestoreMenu?: (release: { x: number; y: number }) => void;
} = {}) {
  const restore =
    onRestoreMenu ?? vi.fn<(release: { x: number; y: number }) => void>();

  function Harness() {
    const ref = useRef<HTMLDivElement>(null);
    const handlers = useBoardRightDragPan({ onRestoreMenu: restore });
    return (
      <div
        ref={ref}
        data-testid="scroller"
        className="overflow-x-auto"
        {...handlers}
      >
        <div style={{ width: 2000 }} />
      </div>
    );
  }

  const { getByTestId } = render(<Harness />);
  const scroller = getByTestId("scroller") as HTMLDivElement;

  // Mirror the browser's clamping; an unscrollable container stays at 0.
  let scrollLeft = 0;
  Object.defineProperty(scroller, "scrollLeft", {
    configurable: true,
    get: () => scrollLeft,
    set: (value: number) => {
      const max = scrollable ? 1500 : 0;
      scrollLeft = Math.min(Math.max(value, 0), max);
    },
  });

  // scrollTop must NEVER be touched by the pan hook. Track writes so an
  // accidental vertical scroll fails the test instead of silently reading 0.
  let scrollTop = 0;
  let scrollTopWrites = 0;
  Object.defineProperty(scroller, "scrollTop", {
    configurable: true,
    get: () => scrollTop,
    set: (value: number) => {
      scrollTopWrites += 1;
      scrollTop = Math.max(0, value);
    },
  });

  return {
    scroller,
    restore,
    setScrollLeft: (v: number) => (scrollLeft = v),
    getScrollTop: () => scrollTop,
    getScrollTopWrites: () => scrollTopWrites,
  };
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

describe("useBoardRightDragPan", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("pans the container horizontally when right-dragging", () => {
    const { scroller, setScrollLeft, getScrollTopWrites } = setup();
    setScrollLeft(0);

    fireEvent.pointerDown(scroller, pointer({ clientX: 300 }));
    fireEvent.pointerMove(scroller, pointer({ clientX: 200 }));

    // Dragging left by 100px reveals 100px further right.
    expect(scroller.scrollLeft).toBe(100);

    fireEvent.pointerMove(scroller, pointer({ clientX: 260 }));
    // Tracks the pointer from the gesture's origin, not incrementally.
    expect(scroller.scrollLeft).toBe(40);

    // Only the horizontal axis moves — scrollTop is never written.
    expect(getScrollTopWrites()).toBe(0);
  });

  it("does not move below the 5px threshold", () => {
    const { scroller, restore } = setup();
    fireEvent.pointerDown(scroller, pointer({ clientX: 300 }));
    fireEvent.pointerMove(scroller, pointer({ clientX: 302 }));

    expect(scroller.scrollLeft).toBe(0);
    fireEvent.pointerUp(scroller, pointer({ clientX: 302 }));
    // A sub-threshold right-click is a stationary click → restore the menu.
    expect(restore).toHaveBeenCalledWith({ x: 302, y: 100 });
  });

  it("pans even when the pointer leaves the container before crossing the threshold (pointerdown capture)", () => {
    // Regression for the v2-review capture hole: pointerdown immediately
    // captures, so moves that arrive on the container (even though the cursor
    // is visually outside) keep the gesture alive past the threshold.
    const { scroller } = setup();
    fireEvent.pointerDown(scroller, pointer({ clientX: 300 }));
    // Large jump in one move — as if the cursor moved outside then back.
    fireEvent.pointerMove(scroller, pointer({ clientX: 150 }));

    expect(scroller.scrollLeft).toBe(150);
  });

  it("tracks a fast single-move drag from the gesture origin", () => {
    const { scroller, setScrollLeft } = setup();
    setScrollLeft(0);
    fireEvent.pointerDown(scroller, pointer({ clientX: 300 }));
    fireEvent.pointerMove(scroller, pointer({ clientX: 50 }));

    expect(scroller.scrollLeft).toBe(250);
  });

  it("ends the gesture on pointercancel and does not restore the menu", () => {
    const { scroller, restore } = setup();
    fireEvent.pointerDown(scroller, pointer({ clientX: 300 }));
    fireEvent.pointerCancel(scroller, pointer({ clientX: 280 }));

    expect(restore).not.toHaveBeenCalled();
    // And a later contextmenu is not suppressed (no armed gesture).
    const prevented = fireEvent.contextMenu(scroller, pointer({ clientX: 280 }));
    expect(prevented).toBe(true);
  });

  it("suppresses contextmenu while a gesture is armed and releases it afterwards", () => {
    const { scroller, restore } = setup();
    // Stationary right-click: contextmenu arrives while armed (measured order:
    // it fires before any movement) and must be swallowed.
    fireEvent.pointerDown(scroller, pointer({ clientX: 300 }));
    const prevented = fireEvent.contextMenu(scroller, pointer({ clientX: 300 }));
    expect(prevented).toBe(false);

    fireEvent.pointerUp(scroller, pointer({ clientX: 300 }));
    // Release restores the menu for a stationary right-click.
    expect(restore).toHaveBeenCalledWith({ x: 300, y: 100 });
  });

  it("keeps the menu suppressed after an actual pan", () => {
    const { scroller, restore } = setup();
    fireEvent.pointerDown(scroller, pointer({ clientX: 300 }));
    fireEvent.pointerMove(scroller, pointer({ clientX: 200 }));
    fireEvent.pointerUp(scroller, pointer({ clientX: 200 }));

    expect(restore).not.toHaveBeenCalled();
  });

  it("keeps the menu suppressed after panning an unscrollable container", () => {
    const { scroller, restore } = setup({ scrollable: false });
    fireEvent.pointerDown(scroller, pointer({ clientX: 300 }));
    fireEvent.pointerMove(scroller, pointer({ clientX: 200 }));
    fireEvent.pointerUp(scroller, pointer({ clientX: 200 }));

    // Intent was established even though scrollLeft couldn't change.
    expect(scroller.scrollLeft).toBe(0);
    expect(restore).not.toHaveBeenCalled();
  });

  it("ignores vertical-only right drags (no pan, menu restored)", () => {
    const { scroller, restore } = setup();
    fireEvent.pointerDown(scroller, pointer({ clientX: 300, clientY: 100 }));
    fireEvent.pointerMove(scroller, pointer({ clientX: 300, clientY: 200 }));
    fireEvent.pointerUp(scroller, pointer({ clientX: 300, clientY: 200 }));

    expect(scroller.scrollLeft).toBe(0);
    expect(restore).toHaveBeenCalledWith({ x: 300, y: 200 });
  });

  it("ignores left-button drags (dnd-kit owns them)", () => {
    const { scroller, restore } = setup();
    fireEvent.pointerDown(scroller, pointer({ button: 0, clientX: 300 }));
    fireEvent.pointerMove(scroller, pointer({ button: 0, clientX: 200 }));
    fireEvent.pointerUp(scroller, pointer({ button: 0, clientX: 200 }));

    expect(scroller.scrollLeft).toBe(0);
    expect(restore).not.toHaveBeenCalled();
  });

  it("ignores non-mouse pointer types (touch/pen untouched)", () => {
    const { scroller, restore } = setup();
    fireEvent.pointerDown(
      scroller,
      pointer({ pointerType: "touch", button: 0, clientX: 300 }),
    );
    fireEvent.pointerMove(
      scroller,
      pointer({ pointerType: "touch", button: 0, clientX: 200 }),
    );
    fireEvent.pointerUp(
      scroller,
      pointer({ pointerType: "touch", button: 0, clientX: 200 }),
    );

    expect(scroller.scrollLeft).toBe(0);
    expect(restore).not.toHaveBeenCalled();
  });

  it("does not suppress contextmenu when no gesture is armed (menu key / non-gesture right-click)", () => {
    const { scroller } = setup();
    const prevented = fireEvent.contextMenu(scroller, pointer({ clientX: 300 }));
    expect(prevented).toBe(true);
  });

  it("ends the gesture on lostpointercapture after a restore decision was made", () => {
    // pointerup → lostpointercapture must not undo the pointerup decision or
    // double-restore.
    const { scroller, restore } = setup();
    fireEvent.pointerDown(scroller, pointer({ clientX: 300 }));
    fireEvent.pointerMove(scroller, pointer({ clientX: 200 }));
    fireEvent.pointerUp(scroller, pointer({ clientX: 200 }));
    fireEvent.lostPointerCapture(scroller, pointer({ clientX: 200 }));

    // Pan → suppressed; lostpointercapture is a no-op for the decision.
    expect(restore).not.toHaveBeenCalled();
  });

  it("does not restore the menu on lostpointercapture without a preceding pointerup decision", () => {
    const { scroller, restore } = setup();
    fireEvent.pointerDown(scroller, pointer({ clientX: 300 }));
    // Browser/OS steals the pointer (e.g. a system menu) → capture lost.
    fireEvent.lostPointerCapture(scroller, pointer({ clientX: 300 }));

    expect(restore).not.toHaveBeenCalled();
  });
});

describe("RIGHT_PAN_THRESHOLD_PX", () => {
  it("sits at 5px (matches the editor drag threshold and dnd-kit distance)", () => {
    expect(RIGHT_PAN_THRESHOLD_PX).toBe(5);
  });
});
