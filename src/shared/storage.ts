import type { Account, ActivityLogEntry, Nip07Permission, Settings, VaultMeta } from './types'

const DEFAULT_SETTINGS: Settings = { autoLockMinutes: 15, theme: 'system' }

interface LocalSchema {
  'vault.meta': VaultMeta | undefined
  accounts: Account[]
  settings: Settings
  activityLog: ActivityLogEntry[]
  'permissions.nip07': Nip07Permission[]
}

const LOCAL_DEFAULTS: LocalSchema = {
  'vault.meta': undefined,
  accounts: [],
  settings: DEFAULT_SETTINGS,
  activityLog: [],
  'permissions.nip07': [],
}

export async function getLocal<K extends keyof LocalSchema>(key: K): Promise<LocalSchema[K]> {
  const result = await chrome.storage.local.get(key)
  return key in result ? (result[key] as LocalSchema[K]) : LOCAL_DEFAULTS[key]
}

export async function setLocal<K extends keyof LocalSchema>(
  key: K,
  value: LocalSchema[K]
): Promise<void> {
  await chrome.storage.local.set({ [key]: value })
}

/** Session storage holds only the derived, memory-only unlock key + activity
 * timestamp. It's cleared on browser restart and marked TRUSTED_CONTEXTS so
 * content scripts / pages can never read it even via a future bug. */
interface SessionSchema {
  unlockedMasterKeyB64: string | undefined
  lastActivityAt: number | undefined
}

const SESSION_DEFAULTS: SessionSchema = {
  unlockedMasterKeyB64: undefined,
  lastActivityAt: undefined,
}

export async function ensureSessionAccessLevel(): Promise<void> {
  await chrome.storage.session.setAccessLevel({
    accessLevel: 'TRUSTED_CONTEXTS',
  })
}

export async function getSession<K extends keyof SessionSchema>(
  key: K
): Promise<SessionSchema[K]> {
  const result = await chrome.storage.session.get(key)
  return key in result ? (result[key] as SessionSchema[K]) : SESSION_DEFAULTS[key]
}

export async function setSession<K extends keyof SessionSchema>(
  key: K,
  value: SessionSchema[K]
): Promise<void> {
  await chrome.storage.session.set({ [key]: value })
}

export async function clearSession(): Promise<void> {
  await chrome.storage.session.clear()
}
