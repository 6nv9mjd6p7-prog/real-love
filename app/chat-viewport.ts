/** Work out whether the focused composer is inside the keyboard-reduced viewport. */
export function chatViewportState(
  layoutHeight: number,
  innerHeight: number,
  visualHeight: number | null,
  visualTop: number | null,
  composerFocused: boolean,
) {
  const currentHeight = visualHeight ?? innerHeight;
  const keyboardOpen = composerFocused && currentHeight < layoutHeight - 120;

  // Refresh the baseline when the keyboard is away so rotation and browser chrome changes do not leave a stale height.
  if (!keyboardOpen) {
    return {
      keyboardOpen: false,
      layoutHeight: Math.max(innerHeight, currentHeight),
      height: null,
      top: 0,
    };
  }

  const height = Math.max(1, Math.min(currentHeight, layoutHeight));
  const maxTop = Math.max(0, layoutHeight - height);
  const top = Math.max(0, Math.min(visualTop ?? 0, maxTop));

  return {keyboardOpen: true, layoutHeight, height, top};
}
