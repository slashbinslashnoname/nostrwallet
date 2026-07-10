import type { Nip07Method } from '../shared/types'
import type { BackgroundResult } from '../shared/messages'

interface InpageRequestMessage {
  source: 'nostr-ext-inpage'
  requestId: string
  method: Nip07Method
  params?: unknown
}

window.addEventListener('message', (event: MessageEvent) => {
  if (event.source !== window || event.origin !== window.location.origin) return
  const data = event.data as Partial<InpageRequestMessage> | undefined
  if (data?.source !== 'nostr-ext-inpage' || typeof data.requestId !== 'string') return

  const { requestId, method, params } = data as InpageRequestMessage

  chrome.runtime
    .sendMessage({
      source: 'nostr-ext-nip07',
      // Trusted: read directly from this isolated world's own DOM binding,
      // not from anything the page's inpage script could pass in.
      origin: window.location.origin,
      method,
      params,
    })
    .then((result: BackgroundResult) => {
      window.postMessage(
        {
          source: 'nostr-ext-isolated',
          requestId,
          result: result.ok ? result.data : undefined,
          error: result.ok ? undefined : result.error,
        },
        window.location.origin
      )
    })
    .catch((error: unknown) => {
      window.postMessage(
        {
          source: 'nostr-ext-isolated',
          requestId,
          error: error instanceof Error ? error.message : String(error),
        },
        window.location.origin
      )
    })
})
