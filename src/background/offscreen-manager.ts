// MV3 service workers get suspended after ~30s idle, which can't hold
// long-lived relay WebSockets reliably. The offscreen document has no such
// idle eviction tied to script activity, so it's the sole home for actual
// relay sockets (see src/offscreen/relay-hub.ts) — the service worker only
// talks to it over chrome.runtime messaging.
//
// chrome.offscreen.Reason has no dedicated "networking/websocket" bucket as
// of this writing; WORKERS is the closest defensible fit for "needs a
// persistent execution context to hold long-lived connections."
const OFFSCREEN_URL = 'src/offscreen/offscreen.html'

let ensurePromise: Promise<void> | null = null

export async function ensureOffscreenDocument(): Promise<void> {
  if (await chrome.offscreen.hasDocument()) return
  // Coalesce concurrent callers into a single createDocument() call.
  ensurePromise ??= chrome.offscreen
    .createDocument({
      url: OFFSCREEN_URL,
      reasons: [chrome.offscreen.Reason.WORKERS],
      justification:
        'Holds long-lived relay WebSocket connections for NIP-46/NIP-47, which the service worker cannot keep alive on its own.',
    })
    .finally(() => {
      ensurePromise = null
    })
  await ensurePromise
}

export async function closeOffscreenDocumentIfUnused(): Promise<void> {
  if (await chrome.offscreen.hasDocument()) {
    await chrome.offscreen.closeDocument()
  }
}
