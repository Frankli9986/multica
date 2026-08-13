#!/usr/bin/env node
/**
 * Verify the contextmenu event-order contract the WS-226 v3 board right-drag
 * pan design relies on (target runtime: Electron 39.8.7 + macOS).
 *
 * The deferred suppression state machine is built on two measured premises:
 *   1. On a right-button press, `contextmenu` fires right after `mousedown`,
 *      BEFORE any threshold-crossing `pointermove` — so the renderer cannot
 *      know at contextmenu time whether the user will pan, and must suppress
 *      unconditionally while a gesture is armed, deciding at release.
 *   2. A renderer `preventDefault()` on `contextmenu` fully suppresses the
 *      main-process `context-menu` event — the single gate that keeps the
 *      native menu from also popping during a pan.
 *
 * This script re-derives both from a live Electron instance using REAL trusted
 * mouse events (Playwright's `page.mouse` dispatches through the OS input
 * pipeline, so the renderer sees `isTrusted === true` events — unlike a
 * synthetic `dispatchEvent`, which never reaches the main-process
 * `context-menu` at all). Both sides of the gate are asserted:
 *
 *   - an unprevented trusted right-click DOES trigger main-process
 *     `context-menu` (count increases);
 *   - a trusted right-click whose renderer handler calls `preventDefault()`
 *     does NOT trigger it (count unchanged), and the renderer observes
 *     `defaultPrevented === true`.
 *
 * Usage:
 *   node apps/desktop/scripts/verify-context-menu-order.js [path/to/out/main/index.js]
 *
 * Exit code 0 when all premises hold; non-zero + message when a premise is
 * violated so a CI/PR author can catch a platform behavior change early.
 */
/* eslint-disable import-x/no-extraneous-dependencies -- playwright is a root devDependency; this is a manual verification aid, not part of the build */
/* eslint-disable no-undef -- document/MouseEvent appear only inside page.evaluate() callbacks that run in the browser context */
import { _electron as electron } from "playwright";
import { existsSync } from "node:fs";

const mainJs =
  process.argv[2] ??
  new URL("../out/main/index.js", import.meta.url).pathname;

if (!existsSync(mainJs)) {
  console.error(`Missing Electron main bundle: ${mainJs}`);
  console.error("Build it first (electron-vite build) and pass the path.");
  process.exit(1);
}

const app = await electron.launch({
  args: [mainJs],
  timeout: 30_000,
});

const page = await app.firstWindow();
await page.waitForLoadState("domcontentloaded");

// Instrument the MAIN process: count every `context-menu` event the main
// window's webContents emits. Playwright's app.evaluate runs in the main
// process, so the counter lives on a main-process global that the Node side
// reads back through a second app.evaluate call.
await app.evaluate(({ BrowserWindow, app }) => {
  globalThis.__cmMainProcessCount = 0;
  const count = () => {
    globalThis.__cmMainProcessCount += 1;
  };
  for (const win of BrowserWindow.getAllWindows()) {
    win.webContents.on("context-menu", count);
  }
  app.on("browser-window-created", (_event, win) => {
    win.webContents.on("context-menu", count);
  });
});

const mainProcessCount = () =>
  app.evaluate(() => globalThis.__cmMainProcessCount ?? 0);

// ── Probe A: order-only listeners, NO preventDefault handler ────────────────
// Measures the trusted-event order (premise 1) and the unprevented gate
// (premise 2a): a real right-click must reach the main process.
await page.evaluate(() => {
  const probe = document.createElement("div");
  probe.id = "cm-probe-a";
  probe.style.cssText =
    "position:fixed;left:0;top:0;width:600px;height:600px;z-index:999999;";
  document.body.appendChild(probe);

  window.__cmOrderA = [];
  for (const name of [
    "pointermove",
    "pointerdown",
    "mousedown",
    "contextmenu",
    "pointerup",
    "mouseup",
  ]) {
    probe.addEventListener(name, () => window.__cmOrderA.push(name), true);
  }
  probe.addEventListener("contextmenu", (event) => {
    window.__cmOrderA.push("defaultPrevented:" + event.defaultPrevented);
  });
});

const ORDER_A_POS = { x: 300, y: 300 };

async function trustedRightClick(x, y) {
  await page.mouse.move(x, y);
  await page.mouse.down({ button: "right" });
  await page.mouse.up({ button: "right" });
  // Give the main-process IPC a beat to land before reading the counter.
  await new Promise((resolve) => setTimeout(resolve, 300));
}

// Premise 2a first (clean counter), then premise 1's stationary order.
await page.evaluate(() => {
  window.__cmOrderA.length = 0;
});
const countBeforeA = await mainProcessCount();
await trustedRightClick(ORDER_A_POS.x, ORDER_A_POS.y);
const countAfterA = await mainProcessCount();
const orderA = await page.evaluate(() => [...window.__cmOrderA]);

// Premise 1b: a trusted right-drag — contextmenu must precede the first
// threshold-crossing pointermove.
await page.evaluate(() => {
  window.__cmOrderA.length = 0;
});
await page.mouse.move(ORDER_A_POS.x, ORDER_A_POS.y);
await page.mouse.down({ button: "right" });
await page.mouse.move(ORDER_A_POS.x - 120, ORDER_A_POS.y, { steps: 6 });
await page.mouse.up({ button: "right" });
await new Promise((resolve) => setTimeout(resolve, 300));
const orderADrag = await page.evaluate(() => [...window.__cmOrderA]);

// ── Probe B: preventDefault handler, no other listeners ─────────────────────
// Premise 2b: a renderer preventDefault() must suppress the main-process
// `context-menu`, and the event must carry defaultPrevented === true.
await page.evaluate(() => {
  const probe = document.createElement("div");
  probe.id = "cm-probe-b";
  probe.style.cssText =
    "position:fixed;left:0;top:0;width:600px;height:600px;z-index:999999;";
  document.body.appendChild(probe);

  window.__cmPrevented = [];
  probe.addEventListener("contextmenu", (event) => {
    event.preventDefault();
    window.__cmPrevented.push(event.defaultPrevented);
  });
});

const countBeforeB = await mainProcessCount();
await trustedRightClick(ORDER_A_POS.x + 200, ORDER_A_POS.y + 200);
const countAfterB = await mainProcessCount();
const prevented = await page.evaluate(() => [...window.__cmPrevented]);

console.log(
  "Trusted right-click (no move) event order:",
  orderA.join(" → "),
);
console.log(
  "Trusted right-drag event order:",
  orderADrag.join(" → "),
);
console.log(
  "Main-process context-menu triggers after unprevented right-click:",
  countAfterA - countBeforeA,
);
console.log(
  "Main-process context-menu triggers after preventDefault'd right-click:",
  countAfterB - countBeforeB,
);
console.log("Renderer defaultPrevented after preventDefault():", prevented[0]);

let ok = true;

// Premise 1: contextmenu fires as part of a trusted stationary right-click.
if (orderA.indexOf("contextmenu") === -1) {
  console.error("VIOLATION: no contextmenu observed on trusted right-click");
  ok = false;
}

// Premise 1b: on a trusted right-drag, contextmenu must precede the first
// pointermove that happens AFTER the press (the initial move positions the
// cursor before the button goes down and is not part of the gesture).
const dragCmIndex = orderADrag.indexOf("contextmenu");
const dragDownIndex = orderADrag.indexOf("pointerdown");
const postPressMoves = orderADrag
  .map((name, index) => ({ name, index }))
  .filter(
    (item) =>
      item.name === "pointermove" &&
      dragDownIndex !== -1 &&
      item.index > dragDownIndex,
  );
const firstPostPressMove = postPressMoves[0]?.index ?? -1;
if (dragCmIndex === -1) {
  console.error("VIOLATION: no contextmenu observed on trusted right-drag");
  ok = false;
} else if (firstPostPressMove !== -1 && dragCmIndex > firstPostPressMove) {
  console.error(
    `VIOLATION: contextmenu (${dragCmIndex}) did not precede the first post-press move (${firstPostPressMove}) in the trusted drag sequence`,
  );
  ok = false;
}

// Premise 2a: an unprevented trusted right-click MUST trigger the main
// process. With a synthetic dispatchEvent this stayed at 0 forever — a real
// event must increment the counter.
if (countAfterA - countBeforeA !== 1) {
  console.error(
    `VIOLATION: unprevented trusted right-click triggered ${countAfterA - countBeforeA} main-process menu(s), expected 1`,
  );
  ok = false;
}

// Premise 2b: a preventDefault'd trusted right-click must NOT trigger the main
// process, and the renderer must observe defaultPrevented === true.
if (countAfterB - countBeforeB !== 0) {
  console.error(
    `VIOLATION: preventDefault'd trusted right-click still triggered ${countAfterB - countBeforeB} main-process menu(s)`,
  );
  ok = false;
}
if (prevented[0] !== true) {
  console.error(
    `VIOLATION: renderer observed defaultPrevented=${prevented[0]} after preventDefault()`,
  );
  ok = false;
}

await app.close();
console.log(ok ? "PASS: both premises hold." : "FAIL: see violations above.");
process.exit(ok ? 0 : 1);
