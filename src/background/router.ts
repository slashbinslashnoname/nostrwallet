import type { BackgroundRequest, BackgroundResult, Nip07ContentMessage } from '../shared/messages'
import type { ActivityDecision } from '../shared/types'
import { getLocal, setLocal } from '../shared/storage'
import * as vault from './vault/vault'
import * as accounts from './vault/accounts'
import { appendActivity } from './activity-log'
import { requestApproval, listPendingApprovals, resolvePendingApproval } from './approval'
import { ensureUnlocked } from './unlock-gate'
import {
  decideNip07,
  listPermissions,
  recordPermission,
  revokePermission,
  clearAllPermissions,
  touchPermissionUsage,
} from './nip07/permission-engine'
import { describeNip07Request, eventKindFromParams, executeNip07 } from './nip07/handlers'

export async function handleBackgroundRequest(
  request: BackgroundRequest
): Promise<BackgroundResult> {
  try {
    const data = await dispatch(request)
    return { ok: true, data }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) }
  }
}

async function dispatch(request: BackgroundRequest): Promise<unknown> {
  switch (request.type) {
    case 'vault.status':
      return vaultStatus()
    case 'vault.create':
      await vault.createVault(request.password)
      return vaultStatus()
    case 'vault.unlock':
      await vault.unlock(request.password)
      return vaultStatus()
    case 'vault.lock':
      await vault.lock()
      return vaultStatus()
    case 'vault.changePassword':
      await vault.changePassword(request.currentPassword, request.newPassword)
      return vaultStatus()

    case 'accounts.list':
      return accounts.listAccounts()
    case 'accounts.create':
      return accounts.createAccount(request.label, request.color)
    case 'accounts.import':
      return accounts.importAccount(request.label, request.color, request.secret)
    case 'accounts.rename':
      return accounts.renameAccount(request.id, request.label)
    case 'accounts.setColor':
      return accounts.setAccountColor(request.id, request.color)
    case 'accounts.setDefault':
      return accounts.setDefaultAccount(request.id)
    case 'accounts.delete':
      return accounts.deleteAccount(request.id)
    case 'accounts.exportNsec':
      return { nsec: await accounts.exportNsec(request.id) }

    case 'settings.get':
      return getLocal('settings')
    case 'settings.update': {
      const current = await getLocal('settings')
      const next = { ...current, ...request.settings }
      await setLocal('settings', next)
      return next
    }

    case 'permissions.nip07.list':
      return listPermissions()
    case 'permissions.nip07.revoke':
      return revokePermission(request.id)
    case 'permissions.nip07.clearAll':
      await clearAllPermissions()
      return { ok: true }

    case 'approval.list':
      return listPendingApprovals()
    case 'approval.decide':
      resolvePendingApproval(request.id, request.decision)
      return { ok: true }
  }
}

async function vaultStatus() {
  return { exists: await vault.vaultExists(), unlocked: await vault.isUnlocked() }
}

export async function handleNip07Message(message: Nip07ContentMessage): Promise<BackgroundResult> {
  try {
    await ensureUnlocked()

    const account = await accounts.getDefaultAccount()
    if (!account) throw new Error('No identity configured yet')

    const eventKind = eventKindFromParams(message.method, message.params)
    const verdict = await decideNip07(message.origin, account.id, message.method, eventKind)

    let allowed: boolean
    let decision: ActivityDecision

    if (verdict === 'allow') {
      allowed = true
      decision = 'auto-allow'
    } else if (verdict === 'deny') {
      allowed = false
      decision = 'auto-deny'
    } else {
      const approval = await requestApproval({
        id: crypto.randomUUID(),
        kind: 'nip07',
        label: message.origin,
        method: message.method,
        eventKind,
        detail: describeNip07Request(message.method, message.params),
      })
      allowed = approval.allow
      decision = approval.allow ? 'user-allow' : 'user-deny'
      if (approval.remember !== 'once') {
        await recordPermission({
          origin: message.origin,
          accountId: account.id,
          method: message.method,
          eventKind,
          decision: approval.allow ? 'allow' : 'deny',
          duration: approval.remember,
        })
      }
    }

    if (!allowed) {
      await appendActivity({
        protocol: 'nip07',
        origin: message.origin,
        method: message.method,
        eventKind,
        decision,
      })
      throw new Error('User rejected the request')
    }

    const result = await executeNip07(account.id, message.method, message.params)
    await touchPermissionUsage(message.origin, account.id, message.method, eventKind)
    await appendActivity({
      protocol: 'nip07',
      origin: message.origin,
      method: message.method,
      eventKind,
      decision,
    })
    return { ok: true, data: result }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) }
  }
}
