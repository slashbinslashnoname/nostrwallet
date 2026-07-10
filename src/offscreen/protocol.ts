import type { Event as NostrEvent } from 'nostr-tools/core'
import type { Filter } from 'nostr-tools/filter'

/** Messages the background service worker sends to the offscreen document,
 * which is the sole holder of actual relay WebSocket connections. */
export type OffscreenRequest =
  | { type: 'relay.subscribe'; subId: string; relays: string[]; filters: Filter[] }
  | { type: 'relay.unsubscribe'; subId: string }
  | { type: 'relay.publish'; relays: string[]; event: NostrEvent }

export interface PublishResult {
  succeeded: string[]
  failed: { relay: string; error: string }[]
}

/** Pushed asynchronously from the offscreen document back to the background
 * service worker as relay traffic arrives. Distinct shape (no `type` field
 * matching BackgroundRequest, and a `source` tag) so background's message
 * listener can tell it apart from popup/options RPC and content-script
 * messages. */
export interface RelayEventPush {
  source: 'nostr-ext-offscreen'
  subId: string
  event: NostrEvent
}

export function isRelayEventPush(message: unknown): message is RelayEventPush {
  return (
    typeof message === 'object' &&
    message !== null &&
    (message as { source?: unknown }).source === 'nostr-ext-offscreen'
  )
}
