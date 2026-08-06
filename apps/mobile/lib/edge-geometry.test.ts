import { describe, expect, it } from "vitest";
import {
  computeAtNewestEdge,
  isDividerPast,
  type ScrollMetrics,
} from "./edge-geometry";

const m = (
  offsetY: number,
  contentH: number,
  viewportH: number,
): ScrollMetrics => ({ offsetY, contentH, viewportH });

describe("computeAtNewestEdge", () => {
  it("short content is always at edge (nothing to scroll)", () => {
    // contentH < viewportH + slack ⇒ maxScroll <= slack ⇒ true
    expect(computeAtNewestEdge(m(0, 500, 800), "oldest")).toBe(true);
    expect(computeAtNewestEdge(m(0, 500, 800), "newest")).toBe(true);
  });

  it("oldest: at bottom means at the newest edge", () => {
    // contentH 2000, viewport 800 ⇒ maxScroll = 1200
    expect(computeAtNewestEdge(m(1200, 2000, 800), "oldest")).toBe(true);
    // slack of 80 means 1190 still counts
    expect(computeAtNewestEdge(m(1120, 2000, 800), "oldest")).toBe(true);
    // outside the slack band
    expect(computeAtNewestEdge(m(1000, 2000, 800), "oldest")).toBe(false);
  });

  it("newest: at top means at the newest edge", () => {
    expect(computeAtNewestEdge(m(0, 2000, 800), "newest")).toBe(true);
    expect(computeAtNewestEdge(m(80, 2000, 800), "newest")).toBe(true);
    expect(computeAtNewestEdge(m(200, 2000, 800), "newest")).toBe(false);
  });

  it("the two directions disagree about which offset is the edge", () => {
    // Top of list: newest-edge for "newest" but NOT for "oldest" when there
    // is plenty to scroll.
    expect(computeAtNewestEdge(m(0, 5000, 800), "newest")).toBe(true);
    expect(computeAtNewestEdge(m(0, 5000, 800), "oldest")).toBe(false);
    // Bottom of list: inverse.
    expect(computeAtNewestEdge(m(4200, 5000, 800), "oldest")).toBe(true);
    expect(computeAtNewestEdge(m(4200, 5000, 800), "newest")).toBe(false);
  });
});

describe("isDividerPast", () => {
  const rect = (y: number, height: number) => ({ y, height });

  it("returns true once the divider's bottom has risen above viewport top", () => {
    // divider sits 200px down from content top, 2px tall
    const r = rect(200, 2);
    // viewport top at 202 (divider bottom exactly at offsetY)
    expect(isDividerPast(r, m(202, 2000, 800), "oldest")).toBe(true);
    expect(isDividerPast(r, m(300, 2000, 800), "oldest")).toBe(true);
    // viewport top at 100 — divider is still below the top
    expect(isDividerPast(r, m(100, 2000, 800), "oldest")).toBe(false);
  });

  it("is direction-symmetric (same answer regardless of sort direction)", () => {
    const r = rect(500, 1);
    for (const dir of ["oldest", "newest"] as const) {
      expect(isDividerPast(r, m(600, 2000, 800), dir)).toBe(true);
      expect(isDividerPast(r, m(400, 2000, 800), dir)).toBe(false);
    }
  });
});
