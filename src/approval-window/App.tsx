import { useEffect, useState } from 'react'
import type { PendingApprovalRequest, RememberDuration } from '../shared/types'
import { callBackground } from '../shared/messages'
import { useTheme } from '../shared/ui/useTheme'
import { ApprovalPrompt } from './ApprovalPrompt'

const POLL_MS = 600

export function App() {
  useTheme()
  const [requests, setRequests] = useState<PendingApprovalRequest[] | null>(null)

  useEffect(() => {
    let cancelled = false
    async function poll() {
      const list = await callBackground({ type: 'approval.list' })
      if (!cancelled) setRequests(list)
    }
    void poll()
    const interval = setInterval(() => void poll(), POLL_MS)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  async function decide(id: string, allow: boolean, remember: RememberDuration) {
    setRequests((current) => current?.filter((r) => r.id !== id) ?? current)
    await callBackground({ type: 'approval.decide', id, decision: { allow, remember } })
  }

  return (
    <div className="flex min-h-screen flex-col gap-3 p-4">
      <div className="text-base font-bold tracking-tight">Requests</div>
      {requests === null && (
        <div className="text-[13px] text-neutral-500 dark:text-neutral-400">Loading…</div>
      )}
      {requests?.length === 0 && (
        <div className="text-[13px] text-neutral-500 dark:text-neutral-400">
          No pending requests.
        </div>
      )}
      {requests?.map((request) => (
        <ApprovalPrompt
          key={request.id}
          request={request}
          onDecide={(allow, remember) => void decide(request.id, allow, remember)}
        />
      ))}
    </div>
  )
}
