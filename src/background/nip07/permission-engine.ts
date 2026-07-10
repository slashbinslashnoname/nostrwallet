import type { Nip07Method, Nip07Permission, RememberDuration } from '../../shared/types'
import { getLocal, setLocal } from '../../shared/storage'

export type PermissionVerdict = 'allow' | 'deny' | 'ask'

const WEEK_MS = 7 * 24 * 60 * 60 * 1000

export async function listPermissions(): Promise<Nip07Permission[]> {
  return getLocal('permissions.nip07')
}

export async function revokePermission(id: string): Promise<Nip07Permission[]> {
  const permissions = await getLocal('permissions.nip07')
  const next = permissions.filter((p) => p.id !== id)
  await setLocal('permissions.nip07', next)
  return next
}

export async function clearAllPermissions(): Promise<void> {
  await setLocal('permissions.nip07', [])
}

function isExpired(permission: Nip07Permission): boolean {
  return permission.expiresAt !== undefined && permission.expiresAt <= Date.now()
}

export async function decideNip07(
  origin: string,
  accountId: string,
  method: Nip07Method,
  eventKind: number | undefined
): Promise<PermissionVerdict> {
  const permissions = await getLocal('permissions.nip07')
  const forThis = permissions.filter(
    (p) => p.origin === origin && p.accountId === accountId && p.method === method
  )

  // A kind-specific rule beats a "for all kinds" rule.
  const kindMatch =
    method === 'signEvent' ? forThis.find((p) => p.eventKind === eventKind) : undefined
  const wildcardMatch = forThis.find((p) => p.eventKind === undefined)
  const match = kindMatch ?? wildcardMatch

  if (!match) return 'ask'
  if (isExpired(match)) {
    void revokePermission(match.id) // lazy prune, fire-and-forget
    return 'ask'
  }
  return match.decision
}

export async function recordPermission(input: {
  origin: string
  accountId: string
  method: Nip07Method
  eventKind?: number
  decision: 'allow' | 'deny'
  duration: Exclude<RememberDuration, 'once'>
}): Promise<void> {
  const permissions = await getLocal('permissions.nip07')
  const withoutExisting = permissions.filter(
    (p) =>
      !(
        p.origin === input.origin &&
        p.accountId === input.accountId &&
        p.method === input.method &&
        p.eventKind === input.eventKind
      )
  )
  const entry: Nip07Permission = {
    id: crypto.randomUUID(),
    origin: input.origin,
    accountId: input.accountId,
    method: input.method,
    eventKind: input.eventKind,
    decision: input.decision,
    createdAt: Date.now(),
    expiresAt: input.duration === 'week' ? Date.now() + WEEK_MS : undefined,
  }
  await setLocal('permissions.nip07', [...withoutExisting, entry])
}

export async function touchPermissionUsage(
  origin: string,
  accountId: string,
  method: Nip07Method,
  eventKind: number | undefined
): Promise<void> {
  const permissions = await getLocal('permissions.nip07')
  const index = permissions.findIndex(
    (p) =>
      p.origin === origin &&
      p.accountId === accountId &&
      p.method === method &&
      p.eventKind === eventKind
  )
  if (index === -1) return
  const next = [...permissions]
  next[index] = { ...next[index]!, lastUsedAt: Date.now() }
  await setLocal('permissions.nip07', next)
}
