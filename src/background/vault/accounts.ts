import { generateSecretKey, getPublicKey } from 'nostr-tools/pure'
import { nip19 } from 'nostr-tools'
import { hexToBytes } from 'nostr-tools/utils'
import type { Account, AccentColor } from '../../shared/types'
import { getLocal, setLocal } from '../../shared/storage'
import { encryptWithKey, decryptWithKey } from './crypto'
import { requireUnlockedMasterKey } from './vault'

export class AccountError extends Error {}

function randomId(): string {
  return crypto.randomUUID()
}

/** Accepts nsec1..., raw 64-char hex, or (rejects) anything else. */
function parseSecretInput(secret: string): Uint8Array {
  const trimmed = secret.trim()
  if (trimmed.startsWith('nsec1')) {
    const decoded = nip19.decode(trimmed as `nsec1${string}`)
    if (decoded.type !== 'nsec') throw new AccountError('Not a valid nsec key')
    return decoded.data
  }
  if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
    return hexToBytes(trimmed)
  }
  throw new AccountError('Enter a valid nsec1... or 64-character hex private key')
}

export async function listAccounts(): Promise<Account[]> {
  return getLocal('accounts')
}

export async function getDefaultAccount(): Promise<Account | undefined> {
  const accounts = await getLocal('accounts')
  return accounts.find((a) => a.isDefault) ?? accounts[0]
}

async function persistNewAccount(
  secretKey: Uint8Array,
  label: string,
  color: AccentColor
): Promise<Account> {
  const masterKey = await requireUnlockedMasterKey()
  const pubkey = getPublicKey(secretKey)
  const accounts = await getLocal('accounts')

  if (accounts.some((a) => a.pubkey === pubkey)) {
    throw new AccountError('An account with this key already exists')
  }

  const { ciphertext, iv } = await encryptWithKey(masterKey, secretKey)
  const account: Account = {
    id: randomId(),
    label,
    pubkey,
    encryptedSecret: ciphertext,
    encryptedSecretIv: iv,
    color,
    isDefault: accounts.length === 0,
    createdAt: Date.now(),
  }

  await setLocal('accounts', [...accounts, account])
  return account
}

export async function createAccount(label: string, color: AccentColor): Promise<Account> {
  return persistNewAccount(generateSecretKey(), label, color)
}

export async function importAccount(
  label: string,
  color: AccentColor,
  secret: string
): Promise<Account> {
  return persistNewAccount(parseSecretInput(secret), label, color)
}

export async function renameAccount(id: string, label: string): Promise<Account> {
  const accounts = await getLocal('accounts')
  const index = accounts.findIndex((a) => a.id === id)
  if (index === -1) throw new AccountError('Account not found')
  const updated = { ...accounts[index]!, label }
  const next = [...accounts]
  next[index] = updated
  await setLocal('accounts', next)
  return updated
}

export async function setAccountColor(id: string, color: AccentColor): Promise<Account> {
  const accounts = await getLocal('accounts')
  const index = accounts.findIndex((a) => a.id === id)
  if (index === -1) throw new AccountError('Account not found')
  const updated = { ...accounts[index]!, color }
  const next = [...accounts]
  next[index] = updated
  await setLocal('accounts', next)
  return updated
}

export async function setDefaultAccount(id: string): Promise<Account[]> {
  const accounts = await getLocal('accounts')
  if (!accounts.some((a) => a.id === id)) throw new AccountError('Account not found')
  const next = accounts.map((a) => ({ ...a, isDefault: a.id === id }))
  await setLocal('accounts', next)
  return next
}

export async function deleteAccount(id: string): Promise<Account[]> {
  const accounts = await getLocal('accounts')
  const removed = accounts.find((a) => a.id === id)
  if (!removed) throw new AccountError('Account not found')

  let next = accounts.filter((a) => a.id !== id)
  if (removed.isDefault && next.length > 0) {
    next = next.map((a, i) => ({ ...a, isDefault: i === 0 }))
  }
  await setLocal('accounts', next)
  return next
}

export async function getDecryptedSecretKey(id: string): Promise<Uint8Array> {
  const masterKey = await requireUnlockedMasterKey()
  const accounts = await getLocal('accounts')
  const account = accounts.find((a) => a.id === id)
  if (!account) throw new AccountError('Account not found')
  return decryptWithKey(masterKey, account.encryptedSecret, account.encryptedSecretIv)
}

export async function exportNsec(id: string): Promise<string> {
  const secretKey = await getDecryptedSecretKey(id)
  return nip19.nsecEncode(secretKey)
}
