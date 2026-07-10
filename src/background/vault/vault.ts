import type { VaultMeta } from '../../shared/types'
import { getLocal, setLocal, getSession, setSession } from '../../shared/storage'
import {
  PBKDF2_ITERATIONS,
  bytesToBase64,
  base64ToBytes,
  randomBytes,
  derivePasswordKey,
  generateMasterKey,
  importMasterKey,
  exportMasterKey,
  wrapMasterKey,
  unwrapMasterKey,
} from './crypto'

/** Lives only for this service-worker instance's lifetime; the source of
 * truth across SW restarts is the (memory-only) session storage entry. */
let cachedMasterKey: CryptoKey | null = null

export class VaultError extends Error {}

export async function vaultExists(): Promise<boolean> {
  return (await getLocal('vault.meta')) !== undefined
}

export async function isUnlocked(): Promise<boolean> {
  return (await getUnlockedMasterKey()) !== null
}

export async function getUnlockedMasterKey(): Promise<CryptoKey | null> {
  if (cachedMasterKey) return cachedMasterKey
  const raw = await getSession('unlockedMasterKeyB64')
  if (!raw) return null
  cachedMasterKey = await importMasterKey(base64ToBytes(raw))
  return cachedMasterKey
}

export async function requireUnlockedMasterKey(): Promise<CryptoKey> {
  const key = await getUnlockedMasterKey()
  if (!key) throw new VaultError('Vault is locked')
  return key
}

async function cacheUnlockedKey(masterKey: CryptoKey): Promise<void> {
  cachedMasterKey = masterKey
  const raw = await exportMasterKey(masterKey)
  await setSession('unlockedMasterKeyB64', bytesToBase64(raw))
  await touchActivity()
}

export async function touchActivity(): Promise<void> {
  await setSession('lastActivityAt', Date.now())
}

export async function createVault(password: string): Promise<void> {
  if (await vaultExists()) throw new VaultError('Vault already exists')

  const salt = randomBytes(16)
  const passwordKey = await derivePasswordKey(password, salt, PBKDF2_ITERATIONS)
  const masterKey = await generateMasterKey()
  const { wrapped, iv } = await wrapMasterKey(masterKey, passwordKey)

  const meta: VaultMeta = {
    version: 1,
    kdf: 'pbkdf2',
    kdfSalt: bytesToBase64(salt),
    kdfIterations: PBKDF2_ITERATIONS,
    wrappedMasterKey: wrapped,
    wrappedMasterKeyIv: iv,
  }
  await setLocal('vault.meta', meta)
  await cacheUnlockedKey(masterKey)
}

export async function unlock(password: string): Promise<void> {
  const meta = await getLocal('vault.meta')
  if (!meta) throw new VaultError('No vault has been created yet')

  const passwordKey = await derivePasswordKey(
    password,
    base64ToBytes(meta.kdfSalt),
    meta.kdfIterations
  )
  let masterKey: CryptoKey
  try {
    masterKey = await unwrapMasterKey(meta.wrappedMasterKey, meta.wrappedMasterKeyIv, passwordKey)
  } catch {
    throw new VaultError('Incorrect password')
  }
  await cacheUnlockedKey(masterKey)
}

export async function lock(): Promise<void> {
  cachedMasterKey = null
  await chrome.storage.session.remove(['unlockedMasterKeyB64', 'lastActivityAt'])
}

export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const meta = await getLocal('vault.meta')
  if (!meta) throw new VaultError('No vault has been created yet')

  const currentPasswordKey = await derivePasswordKey(
    currentPassword,
    base64ToBytes(meta.kdfSalt),
    meta.kdfIterations
  )
  let masterKey: CryptoKey
  try {
    masterKey = await unwrapMasterKey(
      meta.wrappedMasterKey,
      meta.wrappedMasterKeyIv,
      currentPasswordKey
    )
  } catch {
    throw new VaultError('Incorrect current password')
  }

  const newSalt = randomBytes(16)
  const newPasswordKey = await derivePasswordKey(newPassword, newSalt, PBKDF2_ITERATIONS)
  const { wrapped, iv } = await wrapMasterKey(masterKey, newPasswordKey)

  const newMeta: VaultMeta = {
    ...meta,
    kdfSalt: bytesToBase64(newSalt),
    kdfIterations: PBKDF2_ITERATIONS,
    wrappedMasterKey: wrapped,
    wrappedMasterKeyIv: iv,
  }
  await setLocal('vault.meta', newMeta)
  await cacheUnlockedKey(masterKey)
}
