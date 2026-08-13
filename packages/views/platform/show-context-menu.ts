/**
 * Desktop-only helper for restoring the native context menu that the issues
 * board suppresses during a right-drag pan.
 *
 * The board's right-drag pan swallows the `contextmenu` event for the whole
 * gesture (the event fires before any threshold move on the acceptance
 * platform). When the gesture ends without panning over blank board space,
 * the renderer rebuilds the same menu the main process would have shown —
 * via this bridge, so shared `packages/views` never imports Electron directly.
 *
 * On web (no preload bridge) this degrades to a no-op: the renderer cannot
 * restore the browser's native blank-space menu, which is the documented web
 * boundary.
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

interface DesktopShowContextMenuAPI {
  showContextMenu?: (request: {
    x: number;
    y: number;
    params: ShowContextMenuParams;
  }) => Promise<void>;
}

function readDesktopAPI(): DesktopShowContextMenuAPI | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as unknown as { desktopAPI?: DesktopShowContextMenuAPI })
    .desktopAPI;
}

/** True when running inside the Electron desktop shell with the bridge present. */
export function isDesktopShowContextMenuAvailable(): boolean {
  return typeof readDesktopAPI()?.showContextMenu === "function";
}

/** Restore the native context menu at viewport coordinates. No-op on web. */
export function showContextMenu(
  x: number,
  y: number,
  params: ShowContextMenuParams,
): void {
  const api = readDesktopAPI();
  if (!api?.showContextMenu) return;
  void api.showContextMenu({ x, y, params });
}
