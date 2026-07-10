// Positions extension popup-type windows in the top-right corner of the
// current browser window, near where the toolbar icon lives, instead of
// Chrome's default (roughly centered/left).
const MARGIN = 12

export async function topRightPosition(
  width: number
): Promise<{ left: number; top: number }> {
  try {
    const current = await chrome.windows.getLastFocused({ windowTypes: ['normal'] })
    const left = (current.left ?? 0) + (current.width ?? width + MARGIN) - width - MARGIN
    const top = (current.top ?? 0) + MARGIN
    return { left: Math.max(0, Math.round(left)), top: Math.max(0, Math.round(top)) }
  } catch {
    return { left: 0, top: 0 }
  }
}
