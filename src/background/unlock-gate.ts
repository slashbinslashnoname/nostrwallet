import { isUnlocked, onUnlock } from './vault/vault'
import { topRightPosition } from './window-utils'

const UNLOCK_TIMEOUT_MS = 90_000

let unlockWindowId: number | null = null
const waiters = new Set<{ resolve: () => void; reject: (err: Error) => void }>()

onUnlock(() => {
  for (const waiter of waiters) waiter.resolve()
  waiters.clear()
  void closeUnlockWindow()
})

chrome.windows.onRemoved.addListener((id) => {
  if (id !== unlockWindowId) return
  unlockWindowId = null
  for (const waiter of waiters) waiter.reject(new Error('Unlock window was closed'))
  waiters.clear()
})

/** Resolves once the vault is unlocked, opening a standalone unlock/setup
 * window (reusing the popup UI) if it isn't already. Used to gate NIP-07
 * requests that arrive while the vault is locked, so the site's "connect"
 * action actually surfaces the password prompt instead of failing silently. */
export async function ensureUnlocked(): Promise<void> {
  if (await isUnlocked()) return
  await openUnlockWindow()
  await new Promise<void>((resolve, reject) => {
    const entry = { resolve, reject }
    waiters.add(entry)
    setTimeout(() => {
      if (waiters.delete(entry)) reject(new Error('Unlock timed out'))
    }, UNLOCK_TIMEOUT_MS)
  })
}

async function openUnlockWindow(): Promise<void> {
  if (unlockWindowId !== null) {
    try {
      await chrome.windows.update(unlockWindowId, { focused: true })
      return
    } catch {
      unlockWindowId = null
    }
  }
  const width = 380
  const { left, top } = await topRightPosition(width)
  const win = await chrome.windows.create({
    url: chrome.runtime.getURL('src/popup/index.html'),
    type: 'popup',
    width,
    height: 560,
    left,
    top,
  })
  unlockWindowId = win?.id ?? null
}

async function closeUnlockWindow(): Promise<void> {
  if (unlockWindowId === null) return
  try {
    await chrome.windows.remove(unlockWindowId)
  } catch {
    // already closed by the user
  }
  unlockWindowId = null
}
