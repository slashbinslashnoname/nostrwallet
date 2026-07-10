import { finalizeEvent, getPublicKey, type EventTemplate } from 'nostr-tools/pure'
import { nip04, nip44 } from 'nostr-tools'
import type { Nip07Method } from '../../shared/types'
import { getDecryptedSecretKey } from '../vault/accounts'

export function eventKindFromParams(method: Nip07Method, params: unknown): number | undefined {
  if (method !== 'signEvent') return undefined
  const template = params as Partial<EventTemplate> | undefined
  return typeof template?.kind === 'number' ? template.kind : undefined
}

export async function executeNip07(
  accountId: string,
  method: Nip07Method,
  params: unknown
): Promise<unknown> {
  const secretKey = await getDecryptedSecretKey(accountId)

  switch (method) {
    case 'getPublicKey':
      return getPublicKey(secretKey)

    case 'getRelays':
      // No relay-list feature yet; an empty object is a valid NIP-07 response.
      return {}

    case 'signEvent':
      return finalizeEvent(params as EventTemplate, secretKey)

    case 'nip04.encrypt': {
      const { pubkey, plaintext } = params as { pubkey: string; plaintext: string }
      return nip04.encrypt(secretKey, pubkey, plaintext)
    }

    case 'nip04.decrypt': {
      const { pubkey, ciphertext } = params as { pubkey: string; ciphertext: string }
      return nip04.decrypt(secretKey, pubkey, ciphertext)
    }

    case 'nip44.encrypt': {
      const { pubkey, plaintext } = params as { pubkey: string; plaintext: string }
      return nip44.encrypt(plaintext, nip44.getConversationKey(secretKey, pubkey))
    }

    case 'nip44.decrypt': {
      const { pubkey, ciphertext } = params as { pubkey: string; ciphertext: string }
      return nip44.decrypt(ciphertext, nip44.getConversationKey(secretKey, pubkey))
    }
  }
}

export function describeNip07Request(method: Nip07Method, params: unknown): string {
  switch (method) {
    case 'getPublicKey':
      return 'wants to know your public key'
    case 'getRelays':
      return 'wants to know your relay list'
    case 'signEvent': {
      const kind = eventKindFromParams(method, params)
      return `wants you to sign a kind ${kind ?? '?'} event`
    }
    case 'nip04.encrypt':
    case 'nip44.encrypt':
      return 'wants to encrypt a message'
    case 'nip04.decrypt':
    case 'nip44.decrypt':
      return 'wants to decrypt a message'
  }
}
