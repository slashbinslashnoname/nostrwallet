import type { Event as NostrEvent } from 'nostr-tools/core'

type EventHandler = (event: NostrEvent) => void

const handlers = new Map<string, EventHandler>()

export function onRelayEvent(subId: string, handler: EventHandler): void {
  handlers.set(subId, handler)
}

export function offRelayEvent(subId: string): void {
  handlers.delete(subId)
}

export function dispatchRelayEvent(subId: string, event: NostrEvent): void {
  handlers.get(subId)?.(event)
}
