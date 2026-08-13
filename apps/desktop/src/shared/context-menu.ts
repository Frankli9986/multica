/**
 * Shared contract for restoring the native context menu from the renderer.
 *
 * The issues board suppresses the `contextmenu` event during a right-button
 * pan gesture (the event fires before any threshold move on the acceptance
 * platform, so the renderer can't know at that point whether the user will
 * pan). When the gesture ends without panning, the renderer rebuilds the
 * menu it swallowed: cards go through a synthetic `contextmenu` (React
 * path), blank space goes through this IPC — the main process reconstructs
 * the same native menu it would have shown from the real `context-menu`
 * event.
 *
 * `x`/`y` are viewport coordinates at the release point; `params` mirrors the
 * subset of Electron's `context-menu` params the menu builder reads.
 */

export type ShowContextMenuParams = {
  selectionText: string;
  isEditable: boolean;
  linkURL: string;
  editFlags: {
    canCut: boolean;
    canCopy: boolean;
    canPaste: boolean;
    canSelectAll: boolean;
  };
};

export type ShowContextMenuRequest = {
  x: number;
  y: number;
  params: ShowContextMenuParams;
};

const MAX_MENU_COORDINATE = 100_000;

/**
 * Validate a renderer-supplied `menu:show-context` payload before it can drive
 * a native `menu.popup`. Rejects malformed shapes, out-of-range coordinates,
 * and absurdly long strings — the IPC channel is a privilege boundary, so the
 * main process must not trust anything the renderer sends verbatim.
 */
export function parseShowContextMenuRequest(
  value: unknown,
): ShowContextMenuRequest | null {
  if (!value || typeof value !== "object") return null;

  const input = value as Record<string, unknown>;
  if (typeof input.x !== "number" || !Number.isFinite(input.x)) return null;
  if (typeof input.y !== "number" || !Number.isFinite(input.y)) return null;
  if (
    Math.abs(input.x) > MAX_MENU_COORDINATE ||
    Math.abs(input.y) > MAX_MENU_COORDINATE
  ) {
    return null;
  }

  const params = input.params;
  if (!params || typeof params !== "object") return null;
  const p = params as Record<string, unknown>;
  if (typeof p.selectionText !== "string") return null;
  if (p.selectionText.length > 64_000) return null;
  if (typeof p.isEditable !== "boolean") return null;
  if (typeof p.linkURL !== "string") return null;
  if (p.linkURL.length > 2048) return null;

  const editFlags = p.editFlags;
  if (!editFlags || typeof editFlags !== "object") return null;
  const ef = editFlags as Record<string, unknown>;
  if (typeof ef.canCut !== "boolean") return null;
  if (typeof ef.canCopy !== "boolean") return null;
  if (typeof ef.canPaste !== "boolean") return null;
  if (typeof ef.canSelectAll !== "boolean") return null;

  return {
    x: input.x,
    y: input.y,
    params: {
      selectionText: p.selectionText,
      isEditable: p.isEditable,
      linkURL: p.linkURL,
      editFlags: {
        canCut: ef.canCut,
        canCopy: ef.canCopy,
        canPaste: ef.canPaste,
        canSelectAll: ef.canSelectAll,
      },
    },
  };
}
