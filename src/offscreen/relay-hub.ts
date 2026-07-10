import { AbstractRelay } from 'nostr-tools/abstract-relay'
import { verifyEvent } from 'nostr-tools/pure'
import type { Event as NostrEvent } from 'nostr-tools/core'
import type { Filter } from 'nostr-tools/filter'
import type { Subscription } from 'nostr-tools/abstract-relay'
import type { OffscreenRequest, PublishResult, RelayEventPush } from './protocol'

// This document is the sole holder of actual relay WebSocket connections —
// see the architecture note in background/offscreen-manager.ts for why.
const relayPool = new Map<string, AbstractRelay>()
const subscriptions = new Map<string, Subscription[]>()

async function getRelay(url: string): Promise<AbstractRelay> {
  const existing = relayPool.get(url)
  if (existing?.connected) return existing
  const relay = await AbstractRelay.connect(url, { verifyEvent })
  relayPool.set(url, relay)
  return relay
}

async function handleSubscribe(subId: string, relays: string[], filters: Filter[]): Promise<void> {
  const subs: Subscription[] = []
  for (const url of relays) {
    try {
      const relay = await getRelay(url)
      const sub = relay.subscribe(filters, {
        onevent: (event: NostrEvent) => {
          const push: RelayEventPush = { source: 'nostr-ext-offscreen', subId, event }
          void chrome.runtime.sendMessage(push).catch(() => {})
        },
      })
      subs.push(sub)
    } catch {
      // This relay is unreachable; others in the set may still work.
    }
  }
  subscriptions.set(subId, subs)
}

function handleUnsubscribe(subId: string): void {
  const subs = subscriptions.get(subId)
  subs?.forEach((sub) => sub.close())
  subscriptions.delete(subId)
}

async function handlePublish(relays: string[], event: NostrEvent): Promise<PublishResult> {
  const succeeded: string[] = []
  const failed: { relay: string; error: string }[] = []

  await Promise.all(
    relays.map(async (url) => {
      try {
        const relay = await getRelay(url)
        await relay.publish(event)
        succeeded.push(url)
      } catch (error) {
        failed.push({ relay: url, error: error instanceof Error ? error.message : String(error) })
      }
    })
  )

  return { succeeded, failed }
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (typeof message !== 'object' || message === null || !('type' in message)) return false
  const request = message as OffscreenRequest

  switch (request.type) {
    case 'relay.subscribe':
      void handleSubscribe(request.subId, request.relays, request.filters).then(() =>
        sendResponse({ ok: true })
      )
      return true
    case 'relay.unsubscribe':
      handleUnsubscribe(request.subId)
      sendResponse({ ok: true })
      return false
    case 'relay.publish':
      void handlePublish(request.relays, request.event).then((data) =>
        sendResponse({ ok: true, data })
      )
      return true
    default:
      return false
  }
})
