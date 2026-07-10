import type { Nip07Method } from '../shared/types'

interface InpageRequestMessage {
  source: 'nostr-ext-inpage'
  requestId: string
  method: Nip07Method
  params?: unknown
}

interface IsolatedResponseMessage {
  source: 'nostr-ext-isolated'
  requestId: string
  result?: unknown
  error?: string
}

interface PendingCall {
  resolve: (value: unknown) => void
  reject: (reason: Error) => void
}

const pending = new Map<string, PendingCall>()

function call(method: Nip07Method, params?: unknown): Promise<unknown> {
  const requestId = crypto.randomUUID()
  return new Promise((resolve, reject) => {
    pending.set(requestId, { resolve, reject })
    const message: InpageRequestMessage = { source: 'nostr-ext-inpage', requestId, method, params }
    window.postMessage(message, window.location.origin)
  })
}

window.addEventListener('message', (event: MessageEvent) => {
  if (event.source !== window || event.origin !== window.location.origin) return
  const data = event.data as Partial<IsolatedResponseMessage> | undefined
  if (!data || data.source !== 'nostr-ext-isolated' || typeof data.requestId !== 'string') return

  const entry = pending.get(data.requestId)
  if (!entry) return
  pending.delete(data.requestId)

  if (data.error) entry.reject(new Error(data.error))
  else entry.resolve(data.result)
})

const nostr = {
  async getPublicKey(): Promise<string> {
    return call('getPublicKey') as Promise<string>
  },
  async signEvent(event: unknown): Promise<unknown> {
    return call('signEvent', event)
  },
  async getRelays(): Promise<Record<string, { read: boolean; write: boolean }>> {
    return call('getRelays') as Promise<Record<string, { read: boolean; write: boolean }>>
  },
  nip04: {
    async encrypt(pubkey: string, plaintext: string): Promise<string> {
      return call('nip04.encrypt', { pubkey, plaintext }) as Promise<string>
    },
    async decrypt(pubkey: string, ciphertext: string): Promise<string> {
      return call('nip04.decrypt', { pubkey, ciphertext }) as Promise<string>
    },
  },
  nip44: {
    async encrypt(pubkey: string, plaintext: string): Promise<string> {
      return call('nip44.encrypt', { pubkey, plaintext }) as Promise<string>
    },
    async decrypt(pubkey: string, ciphertext: string): Promise<string> {
      return call('nip44.decrypt', { pubkey, ciphertext }) as Promise<string>
    },
  },
}

declare global {
  interface Window {
    nostr?: typeof nostr
  }
}

if (!window.nostr) {
  window.nostr = nostr
}
