"use client";

/**
 * Right-button horizontal pan for a horizontally scrollable container, with
 * deferred context-menu suppression.
 *
 * Solves a specific collision: the issues board is a wide kanban that invites
 * right-dragging to pan across columns, but the right button also owns the
 * context menu. The rule (approved in WS-226 v3):
 *
 * - Hold the right button and move horizontally → the board scrolls to follow
 *   the cursor. Vertical movement is ignored, `scrollTop` is never touched,
 *   and the left button keeps its card-drag semantics.
 * - The context menu is only suppressed once the gesture actually pans; a
 *   stationary right-click must still open the menu.
 *
 * Event-order premise (measured on Electron 39.8.7 + macOS, the acceptance
 * environment): `contextmenu` fires right after the right `mousedown`, before
 * any threshold-crossing `pointermove`. So the renderer cannot know at
 * `contextmenu` time whether the user will pan — it must suppress
 * unconditionally while a gesture is armed, and decide at `pointerup` whether
 * to restore the menu (via the `onRestoreMenu` callback).
 *
 * State machine:
 *
 *   pointerdown (mouse + button 2)  arm gesture, capture the pointer
 *                                     immediately (v3 fix: a gesture that
 *                                     leaves the container before crossing
 *                                     the threshold must not be lost)
 *   contextmenu (capture phase)       armed → preventDefault + stopPropagation
 *   pointermove                       |dx| > 5 → panned, scrollLeft tracks
 *                                     from the gesture origin, never incrementally
 *   pointerup                         panned → menu stays suppressed; else
 *                                     onRestoreMenu(x, y)
 *   pointercancel / lostpointercapture  end gesture, never restore the menu
 *
 * Suppression lives and dies with the gesture — one decision at release, no
 * lingering pending flag. A trailing `pointerup → lostpointercapture` cannot
 * undo it because the decision is made inside `pointerup` itself.
 */

import {
  useCallback,
  useRef,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";

// Matches the editor's DRAG_THRESHOLD_PX and dnd-kit's card-drag distance (5):
// past a click's jitter but well under a deliberate drag. Own named constant —
// the issues domain must not depend on the editor domain.
export const RIGHT_PAN_THRESHOLD_PX = 5;

interface GestureState {
  pointerId: number;
  startX: number;
  startY: number;
  startScrollLeft: number;
  panned: boolean;
}

export interface BoardRightDragPanHandlers {
  onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerUp: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerCancel: (event: ReactPointerEvent<HTMLElement>) => void;
  onLostPointerCapture: (event: ReactPointerEvent<HTMLElement>) => void;
  onContextMenuCapture: (event: ReactMouseEvent<HTMLElement>) => void;
}

/**
 * @param onRestoreMenu Called on release when the gesture never panned. The
 *   caller decides how to restore the menu at that point (dispatch a synthetic
 *   contextmenu for cards, or rebuild the native menu through the desktop
 *   bridge for blank space).
 */
export function useBoardRightDragPan({
  onRestoreMenu,
}: {
  onRestoreMenu: (release: { x: number; y: number }) => void;
}): BoardRightDragPanHandlers {
  // A ref, not state: a pan updates on every pointermove, and re-rendering
  // the board at that rate would stutter the scroll it is driving.
  const gestureRef = useRef<GestureState | null>(null);
  const onRestoreMenuRef = useRef(onRestoreMenu);
  onRestoreMenuRef.current = onRestoreMenu;

  const onPointerDown = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    // Only the mouse right button pans. Touch/pen and the left button (dnd-kit
    // card drag) never enter this state machine.
    if (event.pointerType !== "mouse" || event.button !== 2) return;

    gestureRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startScrollLeft: event.currentTarget.scrollLeft,
      panned: false,
    };
    // Capture at pointerdown (not on threshold-crossing like the editor hook):
    // if the user starts at the container edge and the first moves land
    // outside it, the container still receives every move/up and the gesture
    // cannot be lost before it crosses the threshold.
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }, []);

  const onContextMenuCapture = useCallback((event: ReactMouseEvent<HTMLElement>) => {
    // While a gesture is armed, always swallow the context menu — the
    // measured order fires it before any movement, so `panned` cannot gate
    // here. Whether the menu comes back is decided at release.
    if (!gestureRef.current) return;
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const onPointerMove = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    const gesture = gestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - gesture.startX;
    if (!gesture.panned) {
      if (Math.abs(deltaX) <= RIGHT_PAN_THRESHOLD_PX) return;
      gesture.panned = true;
    }
    // Recompute from the gesture origin every move — never incrementally — so
    // fast drags cannot accumulate error. Assigning past either end is clamped
    // by the browser, so an unscrollable board simply stays put while still
    // counting as a pan. Only scrollLeft is written; scrollTop never changes.
    event.currentTarget.scrollLeft = gesture.startScrollLeft - deltaX;
  }, []);

  const onPointerUp = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    // End the gesture first so the restore path (which may dispatch a
    // synthetic contextmenu) is not suppressed by our own capture handler.
    const gesture = gestureRef.current;
    gestureRef.current = null;
    if (!gesture || gesture.pointerId !== event.pointerId) return;

    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture?.(event.pointerId);
    }

    // One-time decision: panned keeps the menu suppressed; a stationary or
    // vertical-only right-click restores it. `lostpointercapture` firing next
    // cannot undo this — the decision is already made.
    if (!gesture.panned) {
      onRestoreMenuRef.current({ x: event.clientX, y: event.clientY });
    }
  }, []);

  const onPointerCancel = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    // Browser took the gesture over (pointer lost, window blur). Never restore
    // the menu — a menu popping up on a cancelled gesture reads as a glitch.
    const gesture = gestureRef.current;
    gestureRef.current = null;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture?.(event.pointerId);
    }
  }, []);

  const onLostPointerCapture = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    // Only ends the active gesture. The restore decision belongs to pointerup;
    // a trailing lostpointercapture from our own releasePointerCapture must not
    // re-trigger or undo anything.
    const gesture = gestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    gestureRef.current = null;
  }, []);

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    onLostPointerCapture,
    onContextMenuCapture,
  };
}
