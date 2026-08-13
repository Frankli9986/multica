import { test, expect, type Page } from "@playwright/test";
import { loginAsDefault, reloadAppPage, createTestApi } from "./helpers";
import type { TestApiClient } from "./fixtures";

// WS-227 / multica-ai#6700: right-drag horizontal pan on the issues board.
// These run in the existing Chromium harness (the board is the default issues
// view). The desktop-native side (renderer preventDefault gating the main
// process menu) is covered by the main-process unit tests + the Electron
// smoke spec; here we assert the renderer behaviors that are observable in
// any browser.
test.describe("Board right-drag pan (multica-ai#6700)", () => {
  let api: TestApiClient;

  test.beforeEach(async ({ page }) => {
    api = await createTestApi();
    await loginAsDefault(page);
  });

  test.afterEach(async () => {
    if (api) {
      await api.cleanup();
    }
  });

  async function findBoardScroller(page: Page) {
    await expect(
      page.locator('.overflow-x-auto').first(),
    ).toBeVisible({ timeout: 15000 });
    return page.locator(".overflow-x-auto").first();
  }

  test("right-drag pans the board horizontally", async ({ page }) => {
    await api.createIssue("E2E Pan " + Date.now());
    await reloadAppPage(page);

    const scroller = await findBoardScroller(page);
    const before = await scroller.evaluate((el) => ({
      scrollLeft: el.scrollLeft,
      scrollTop: el.scrollTop,
    }));

    // Right-button press + horizontal move → the board follows the cursor.
    const box = await scroller.boundingBox();
    if (!box) throw new Error("board scroller has no bounding box");
    await page.mouse.move(box.x + box.width - 10, box.y + box.height / 2);
    await page.mouse.down({ button: "right" });
    await page.mouse.move(box.x + box.width - 100, box.y + box.height / 2, {
      steps: 5,
    });
    await page.mouse.up({ button: "right" });

    const after = await scroller.evaluate((el) => ({
      scrollLeft: el.scrollLeft,
      scrollTop: el.scrollTop,
    }));
    expect(after.scrollLeft).not.toBe(before.scrollLeft);
    // Horizontal pan only — scrollTop never moves.
    expect(after.scrollTop).toBe(before.scrollTop);
  });

  test("right-drag does not open a card context menu", async ({ page }) => {
    const title = "E2E Pan Menu " + Date.now();
    await api.createIssue(title);
    await reloadAppPage(page);

    const scroller = await findBoardScroller(page);
    await expect(page.getByText(title)).toBeVisible({ timeout: 15000 });

    const box = await scroller.boundingBox();
    if (!box) throw new Error("board scroller has no bounding box");
    await page.mouse.move(box.x + box.width - 10, box.y + box.height / 2);
    await page.mouse.down({ button: "right" });
    await page.mouse.move(box.x + box.width - 120, box.y + box.height / 2, {
      steps: 5,
    });
    await page.mouse.up({ button: "right" });

    // The issue-actions context menu (role=menu) must not have appeared.
    await expect(page.getByRole("menu")).toHaveCount(0);
  });
});
