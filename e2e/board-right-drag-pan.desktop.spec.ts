import { test, expect } from "@playwright/test";
import { _electron as electron, type ElectronApplication, type Page } from "playwright";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { createTestApi } from "./helpers";
import type { TestApiClient } from "./fixtures";

// WS-227 / multica-ai#6700: Electron smoke for the board right-drag pan.
//
// This spec exercises the real Electron acceptance environment (renderer
// preventDefault gating the main-process `context-menu` popup, which the
// Chromium harness cannot see). It is gated so it stays out of the default
// `make check-worktree` run:
//   - `E2E_DESKTOP=1` must be set;
//   - `apps/desktop/out/` must already be built
//     (`pnpm --filter @multica/desktop exec electron-vite build`, with
//     VITE_API_URL pointing at a local backend — the same backend the
//     `TestApiClient` fixtures below log in against).
//
// Unlike the first revision, this smoke is self-contained: it logs in through
// the existing E2E API fixture flow (send-code → verify-code → workspace →
// onboarded → issue), injects the resulting token into the Electron renderer
// before boot, and waits for the REAL board to render before touching the
// mouse. It then asserts the acceptance behaviors with real trusted mouse
// events:
//   - right-drag pans horizontally (`scrollLeft` changes) while `scrollTop`
//     stays untouched;
//   - a pan never opens a card context menu (`role=menu` stays absent);
//   - a stationary right-click on a card still restores its context menu.
// The card-drag (left-button) non-regression is covered by the hook/BoardView
// unit + integration tests.

const DESKTOP_OUT = join(process.cwd(), "apps", "desktop", "out", "main", "index.js");
const ENABLED = process.env.E2E_DESKTOP === "1" && existsSync(DESKTOP_OUT);

test.skip(!ENABLED, "Set E2E_DESKTOP=1 and build apps/desktop/out to run the Electron smoke");

test.describe("Board right-drag pan — Electron smoke", () => {
  let app: ElectronApplication;
  let page: Page;
  let api: TestApiClient;
  let boardTitle: string;

  const boardScroller = () => page.locator(".overflow-x-auto.gap-4").first();

  async function resetBoardScroll() {
    await boardScroller().evaluate((el) => {
      el.scrollLeft = 0;
    });
  }

  test.beforeAll(async () => {
    // 1. Log in via the shared E2E API fixture flow (creates the user,
    //    workspace, onboarded marker) and seed an issue so the board has a
    //    real card to right-click.
    api = await createTestApi();
    boardTitle = "E2E Desktop Pan " + Date.now();
    await api.createIssue(boardTitle);
    const token = api.getToken();
    if (!token) throw new Error("E2E login did not return an auth token");

    // 2. Launch the built Electron app and inject the session into the
    //    renderer before it boots, so it auto-navigates to the workspace's
    //    issues board instead of sitting on the login page.
    app = await electron.launch({ args: [DESKTOP_OUT] });
    page = await app.firstWindow();
    await page.waitForLoadState("domcontentloaded");
    await page.addInitScript((t) => {
      localStorage.setItem("multica_token", t);
      localStorage.setItem("multica:chat:isOpen", "false");
    }, token);
    await page.reload({ waitUntil: "domcontentloaded" });

    // 3. Reach the real board: the board scroller is the `.overflow-x-auto`
    //    container with `gap-4` (the tab bar also scrolls horizontally).
    const scroller = boardScroller();
    await expect(scroller).toBeVisible({ timeout: 30000 });
    await expect(page.getByText(boardTitle)).toBeVisible({ timeout: 15000 });
    await resetBoardScroll();
  });

  test.afterAll(async () => {
    if (app) await app.close();
    if (api) await api.cleanup();
  });

  test("right-drag pans the board horizontally and leaves scrollTop untouched", async () => {
    const scroller = boardScroller();
    await resetBoardScroll();

    const before = await scroller.evaluate((el) => ({
      scrollLeft: el.scrollLeft,
      scrollTop: el.scrollTop,
    }));

    const box = await scroller.boundingBox();
    if (!box) throw new Error("board scroller has no bounding box");
    await page.mouse.move(box.x + box.width - 20, box.y + box.height / 2);
    await page.mouse.down({ button: "right" });
    await page.mouse.move(box.x + box.width - 140, box.y + box.height / 2, {
      steps: 6,
    });
    await page.mouse.up({ button: "right" });

    const after = await scroller.evaluate((el) => ({
      scrollLeft: el.scrollLeft,
      scrollTop: el.scrollTop,
    }));

    // The board follows the cursor on the horizontal axis only.
    expect(after.scrollLeft).not.toBe(before.scrollLeft);
    expect(after.scrollTop).toBe(before.scrollTop);
  });

  test("a pan never opens a card context menu", async () => {
    const scroller = boardScroller();
    await resetBoardScroll();
    await expect(page.getByText(boardTitle)).toBeVisible();

    const box = await scroller.boundingBox();
    if (!box) throw new Error("board scroller has no bounding box");
    await page.mouse.move(box.x + box.width - 20, box.y + box.height / 2);
    await page.mouse.down({ button: "right" });
    await page.mouse.move(box.x + box.width - 150, box.y + box.height / 2, {
      steps: 6,
    });
    await page.mouse.up({ button: "right" });

    // The card's IssueActionsContextMenu (role=menu) must not appear.
    await expect(page.getByRole("menu")).toHaveCount(0);
  });

  test("a stationary right-click on a card still opens its context menu", async () => {
    // Reset the board so the seeded card is in view.
    await resetBoardScroll();
    const card = page.locator(".group\\/card").first();
    await expect(card).toBeVisible({ timeout: 15000 });

    const box = await card.boundingBox();
    if (!box) throw new Error("card has no bounding box");

    // Press + release in place — no movement, so no pan, so the deferred
    // menu must be restored at the release point.
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down({ button: "right" });
    await page.mouse.up({ button: "right" });

    await expect(page.getByRole("menu")).toBeVisible({ timeout: 5000 });
  });
});
