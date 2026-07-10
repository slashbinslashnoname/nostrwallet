import { useState } from 'react'
import type { PendingApprovalRequest, RememberDuration } from '../shared/types'
import { Button } from '../shared/ui/Button'
import { MonoText } from '../shared/ui/MonoText'
import { Surface } from '../shared/ui/Surface'

const DURATIONS: { value: RememberDuration; label: string }[] = [
  { value: 'once', label: 'Just once' },
  { value: 'week', label: 'For a week' },
  { value: 'always', label: 'Always' },
]

export function ApprovalPrompt({
  request,
  onDecide,
}: {
  request: PendingApprovalRequest
  onDecide: (allow: boolean, remember: RememberDuration) => void
}) {
  const [remember, setRemember] = useState<RememberDuration>('once')

  return (
    <Surface>
      <div className="flex flex-col gap-3">
        <div>
          <MonoText className="text-[13px] text-neutral-900 dark:text-neutral-50">
            {request.label}
          </MonoText>
          <div className="mt-1 text-[13px] text-neutral-600 dark:text-neutral-300">
            {request.detail ?? request.method}
          </div>
        </div>

        <div>
          <div className="mb-1.5 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
            Remember this choice
          </div>
          <div className="flex gap-1 rounded-full bg-neutral-100 p-[3px] dark:bg-neutral-800">
            {DURATIONS.map((d) => (
              <button
                key={d.value}
                type="button"
                onClick={() => setRemember(d.value)}
                className={`flex-1 rounded-full px-2 py-1.5 text-[12px] font-semibold transition-colors ${
                  remember === d.value
                    ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-700 dark:text-neutral-50'
                    : 'text-neutral-500 dark:text-neutral-400'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={() => onDecide(false, remember)}>
            Deny
          </Button>
          <Button variant="primary" className="flex-1" onClick={() => onDecide(true, remember)}>
            Allow
          </Button>
        </div>
      </div>
    </Surface>
  )
}
