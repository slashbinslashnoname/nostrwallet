export interface Account {
  id: string
  label: string
  pubkey: string // hex
  encryptedSecret: string // base64 AES-GCM ciphertext
  encryptedSecretIv: string // base64
  color: AccentColor
  isDefault: boolean
  createdAt: number
}

export type AccentColor = 'blue' | 'violet' | 'green' | 'amber' | 'rose'

export interface VaultMeta {
  version: 1
  kdf: 'pbkdf2'
  kdfSalt: string // base64
  kdfIterations: number
  wrappedMasterKey: string // base64, AES-GCM(masterKey) under password-derived key
  wrappedMasterKeyIv: string // base64
}

export type Nip07Method =
  | 'getPublicKey'
  | 'getRelays'
  | 'signEvent'
  | 'nip04.encrypt'
  | 'nip04.decrypt'
  | 'nip44.encrypt'
  | 'nip44.decrypt'

export interface Nip07Permission {
  id: string
  accountId: string
  origin: string
  method: Nip07Method
  eventKind?: number // only meaningful for signEvent; undefined = all kinds
  decision: 'allow' | 'deny'
  createdAt: number
  lastUsedAt?: number
  /** undefined = never expires ("always"). Past-due entries are treated as
   * no match (falls back to asking again) and pruned lazily. */
  expiresAt?: number
}

export type Nip47Method =
  | 'pay_invoice'
  | 'make_invoice'
  | 'lookup_invoice'
  | 'get_balance'
  | 'get_info'
  | 'list_transactions'
  | 'keysend'
  | 'sign_message'

export interface Nip47PairingPolicy {
  maxSatsPerPayment: number
  maxSatsPerDay: number
  autoApproveUnderSats: number // 0 = always ask
}

export interface Nip47BudgetState {
  spentTodaySats: number
  dayResetAt: number // epoch ms of next reset
}

export interface Nip47Pairing {
  id: string
  label: string
  walletPubkey: string
  connectionSecret: string // encrypted at rest, same vault master key
  connectionSecretIv: string
  relays: string[]
  supportedMethods: Nip47Method[]
  policy: Nip47PairingPolicy
  budgetState: Nip47BudgetState
  isDefault: boolean
  createdAt: number
  lastUsedAt?: number
}

export type Protocol = 'nip07' | 'nip47'

export type ActivityDecision = 'auto-allow' | 'user-allow' | 'auto-deny' | 'user-deny' | 'error'

export interface ActivityLogEntry {
  id: string
  ts: number
  protocol: Protocol
  origin?: string
  pairingId?: string
  method: string
  eventKind?: number
  amountSats?: number
  decision: ActivityDecision
  detail?: string
}

export type ThemePreference = 'light' | 'dark' | 'system'

export interface Settings {
  autoLockMinutes: number
  theme: ThemePreference
}

/** A user-facing approval prompt awaiting Allow/Deny, surfaced in the
 * approval-window popup. `kind` will grow to include 'nip47' in a later
 * phase. `label` is the display identity for the requester (a site origin
 * for nip07). */
export interface PendingApprovalRequest {
  id: string
  kind: 'nip07'
  label: string
  method: Nip07Method
  eventKind?: number
  detail?: string
  createdAt: number
}

export type RememberDuration = 'once' | 'week' | 'always'

export interface ApprovalDecision {
  allow: boolean
  remember: RememberDuration
}
