import type { Event as NostrEvent } from 'nostr-tools/core'
import type { Filter } from 'nostr-tools/filter'
import type { OffscreenRequest, PublishResult } from '../offscreen/protocol'
import { ensureOffscreenDocument } from './offscreen-manager'

async function sendToOffscreen<T>(request: OffscreenRequest): Promise<T> {
  await ensureOffscreenDocument()
  return chrome.runtime.sendMessage(request)
}

export async function relaySubscribe(subId: string, relays: string[], filters: Filter[]) {
  await sendToOffscreen({ type: 'relay.subscribe', subId, relays, filters })
}

export async function relayUnsubscribe(subId: string) {
  await sendToOffscreen({ type: 'relay.unsubscribe', subId })
}

export async function relayPublish(relays: string[], event: NostrEvent): Promise<PublishResult> {
  const response = await sendToOffscreen<{ ok: true; data: PublishResult }>({
    type: 'relay.publish',
    relays,
    event,
  })
  return response.data
}
