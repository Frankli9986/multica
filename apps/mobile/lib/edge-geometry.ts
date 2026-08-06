/**
 * Pure geometry helpers for the direction-aware timeline list (mobile).
 *
 * Extracted so the scroll math can be unit-tested without a FlashList /
 * native scroll event. See timeline-list.tsx for wiring.
 *
 * Coordinate system: FlashList `contentOffset.y` grows downward from the
 * top; `contentSize.height` is the full content height; viewport top is at
 * `offsetY`, viewport bottom at `offsetY + viewportH`.
 *
 * - Oldest-first: reading order is top → bottom, the "new content" edge is
 *   the bottom (offset near maxScroll).
 * - Newest-first: the top-level rows are reversed, so the newest content is
 *   at the top (offset near 0) and the user scrolls DOWN to read older
 *   content.
 */
import type { TimelineSortDirection } from "@multica/core/issues/timeline-sort";

/** Pixel slack at either edge — inside this band the user is treated as
 *  "caught up" so the new-comment chip stays quiet for entries they're
 *  about to see anyway. */
export const AT_EDGE_SLACK_PX = 80;

export interface ScrollMetrics {
  offsetY: number;
  contentH: number;
  viewportH: number;
}

/**
 * True when the viewport is at the "new content" edge for the given
 * direction: bottom in oldest-first, top in newest-first.
 *
 * Content shorter than the viewport is considered at-edge in BOTH
 * directions (nothing to scroll).
 */
export function computeAtNewestEdge(
  metrics: ScrollMetrics,
  direction: TimelineSortDirection,
  slack = AT_EDGE_SLACK_PX,
): boolean {
  const maxScroll = Math.max(0, metrics.contentH - metrics.viewportH);
  if (maxScroll <= slack) return true;
  if (direction === "oldest") {
    return metrics.contentH - (metrics.offsetY + metrics.viewportH) <= slack;
  }
  return metrics.offsetY <= slack;
}

/** Bounding rect of a divider anchor in content-y coordinates (the same
 *  coordinate space as `contentOffset.y`). */
export interface DividerRect {
  y: number;
  height: number;
}

/**
 * Has the divider been scrolled into the "already read" side?
 *
 * The divider is a time boundary (entries newer than the last-viewed
 * snapshot on one side, older on the other). Regardless of top-level sort
 * direction, the user reads by scrolling DOWN through content-y:
 *
 *   - oldest-first: newest content sits at the bottom; scrolling down
 *     reaches it and carries the divider up and out the top.
 *   - newest-first: newest content sits at the top with the divider below
 *     it; scrolling down toward older content carries the divider up and
 *     out the top as well.
 *
 * In both cases the divider is "past" once its bottom edge has risen above
 * the viewport top (`rect.bottom <= offsetY`). The `direction` parameter is
 * accepted for API symmetry with {@link computeAtNewestEdge} and to make the
 * table-driven test assert the symmetry explicitly; the result is identical
 * for both directions.
 *
 * (An earlier draft inverted the newest case to `rect.y >= offsetY +
 * viewportH`, which fires while the divider is still BELOW the viewport —
 * i.e. before the user has ever reached it. Round-4 review caught this; the
 * formula is now direction-symmetric.)
 */
export function isDividerPast(
  rect: DividerRect,
  metrics: ScrollMetrics,
  _direction: TimelineSortDirection,
): boolean {
  return rect.y + rect.height <= metrics.offsetY;
}
