import type {
  Account,
  AccentColor,
  ApprovalDecision,
  Nip07Method,
  Nip07Permission,
  PendingApprovalRequest,
  Settings,
} from './types'

/**
 * RPC contract between extension UI (popup/options/approval-window) and the
 * background service worker. Extended per-phase rather than pre-declared.
 */
export type BackgroundRequest =
  | { type: 'vault.status' }
  | { type: 'vault.create'; password: string }
  | { type: 'vault.unlock'; password: string }
  | { type: 'vault.lock' }
  | { type: 'vault.changePassword'; currentPassword: string; newPassword: string }
  | { type: 'accounts.list' }
  | { type: 'accounts.create'; label: string; color: AccentColor }
  | { type: 'accounts.import'; label: string; color: AccentColor; secret: string }
  | { type: 'accounts.rename'; id: string; label: string }
  | { type: 'accounts.setColor'; id: string; color: AccentColor }
  | { type: 'accounts.setDefault'; id: string }
  | { type: 'accounts.delete'; id: string }
  | { type: 'accounts.exportNsec'; id: string }
  | { type: 'settings.get' }
  | { type: 'settings.update'; settings: Partial<Settings> }
  | { type: 'permissions.nip07.list' }
  | { type: 'permissions.nip07.revoke'; id: string }
  | { type: 'permissions.nip07.clearAll' }
  | { type: 'approval.list' }
  | { type: 'approval.decide'; id: string; decision: ApprovalDecision }

export interface VaultStatus {
  exists: boolean
  unlocked: boolean
}

interface BackgroundResponseMap {
  'vault.status': VaultStatus
  'vault.create': VaultStatus
  'vault.unlock': VaultStatus
  'vault.lock': VaultStatus
  'vault.changePassword': VaultStatus
  'accounts.list': Account[]
  'accounts.create': Account
  'accounts.import': Account
  'accounts.rename': Account
  'accounts.setColor': Account
  'accounts.setDefault': Account[]
  'accounts.delete': Account[]
  'accounts.exportNsec': { nsec: string }
  'settings.get': Settings
  'settings.update': Settings
  'permissions.nip07.list': Nip07Permission[]
  'permissions.nip07.revoke': Nip07Permission[]
  'permissions.nip07.clearAll': { ok: true }
  'approval.list': PendingApprovalRequest[]
  'approval.decide': { ok: true }
}

export type BackgroundResponseFor<T extends BackgroundRequest['type']> =
  T extends keyof BackgroundResponseMap ? BackgroundResponseMap[T] : never

export type BackgroundResult<T = unknown> = { ok: true; data: T } | { ok: false; error: string }

export async function callBackground<T extends BackgroundRequest['type']>(
  request: Extract<BackgroundRequest, { type: T }>
): Promise<BackgroundResponseFor<T>> {
  const result = (await chrome.runtime.sendMessage(request)) as BackgroundResult<
    BackgroundResponseFor<T>
  >
  if (!result.ok) throw new Error(result.error)
  return result.data
}

/**
 * Contract between the isolated-world content script and the background
 * service worker for NIP-07 page requests. Distinct shape (no `type` field)
 * so the background message listener can tell it apart from BackgroundRequest.
 */
export interface Nip07ContentMessage {
  source: 'nostr-ext-nip07'
  origin: string
  method: Nip07Method
  params: unknown
}

export function isNip07ContentMessage(message: unknown): message is Nip07ContentMessage {
  return (
    typeof message === 'object' &&
    message !== null &&
    (message as { source?: unknown }).source === 'nostr-ext-nip07'
  )
}
