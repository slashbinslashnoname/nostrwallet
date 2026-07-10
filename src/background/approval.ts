import type { ApprovalDecision, PendingApprovalRequest } from '../shared/types'

const APPROVAL_TIMEOUT_MS = 90_000
// Grace period before closing an idle approval window, so a rapid follow-up
// request (e.g. getPublicKey immediately followed by signEvent) reuses the
// same window instead of causing a close/reopen flicker.
const CLOSE_GRACE_MS = 800

interface PendingEntry {
  request: PendingApprovalRequest
  resolve: (decision: ApprovalDecision) => void
}

// In-memory only: a pending approval's promise chain lives entirely within
// this service-worker instance. Chrome keeps a SW alive while a message
// channel is awaiting sendResponse (up to ~5 minutes), which comfortably
// covers our 90s approval timeout in the common case.
const pending = new Map<string, PendingEntry>()
let approvalWindowId: number | null = null

export function listPendingApprovals(): PendingApprovalRequest[] {
  return [...pending.values()].map((entry) => entry.request)
}

export function resolvePendingApproval(id: string, decision: ApprovalDecision): void {
  pending.get(id)?.resolve(decision)
}

export async function requestApproval(
  request: Omit<PendingApprovalRequest, 'createdAt'>
): Promise<ApprovalDecision> {
  const full: PendingApprovalRequest = { ...request, createdAt: Date.now() }

  const decisionPromise = new Promise<ApprovalDecision>((resolve) => {
    pending.set(full.id, { request: full, resolve })
  })
  const timeoutPromise = new Promise<ApprovalDecision>((resolve) => {
    setTimeout(() => resolve({ allow: false, remember: 'once' }), APPROVAL_TIMEOUT_MS)
  })

  await ensureApprovalWindow()
  const decision = await Promise.race([decisionPromise, timeoutPromise])
  pending.delete(full.id)
  scheduleCloseIfIdle()
  return decision
}

function scheduleCloseIfIdle(): void {
  const windowIdAtScheduleTime = approvalWindowId
  setTimeout(() => {
    void closeApprovalWindowIfIdle(windowIdAtScheduleTime)
  }, CLOSE_GRACE_MS)
}

async function ensureApprovalWindow(): Promise<void> {
  if (approvalWindowId !== null) {
    try {
      await chrome.windows.update(approvalWindowId, { focused: true })
      return
    } catch {
      approvalWindowId = null
    }
  }
  const win = await chrome.windows.create({
    url: chrome.runtime.getURL('src/approval-window/index.html'),
    type: 'popup',
    width: 380,
    height: 480,
  })
  approvalWindowId = win?.id ?? null
}

async function closeApprovalWindowIfIdle(windowIdAtScheduleTime: number | null): Promise<void> {
  // Only close the window that was open when we scheduled this check — if a
  // new request already replaced it (or it was closed and reopened), leave
  // the current one alone.
  if (pending.size > 0 || approvalWindowId === null || approvalWindowId !== windowIdAtScheduleTime)
    return
  try {
    await chrome.windows.remove(approvalWindowId)
  } catch {
    // window may already be closed by the user
  }
  approvalWindowId = null
}
