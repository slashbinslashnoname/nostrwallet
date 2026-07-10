import { useState, type FormEvent } from 'react'
import { callBackground } from '../../shared/messages'
import { BrandMark } from '../../shared/ui/Brand'
import { Button } from '../../shared/ui/Button'
import { Input, Label, Textarea } from '../../shared/ui/Input'
import { Surface } from '../../shared/ui/Surface'
import { ThemeToggle } from '../../shared/ui/ThemeToggle'

const ACCENT_COLORS = ['blue', 'violet', 'green', 'amber', 'rose'] as const

export function CreateIdentityView({
  onDone,
  showStepDots,
}: {
  onDone: () => void
  showStepDots?: boolean
}) {
  const [label, setLabel] = useState('Main')
  const [mode, setMode] = useState<'create' | 'import'>('create')
  const [secret, setSecret] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      if (mode === 'create') {
        await callBackground({
          type: 'accounts.create',
          label: label.trim() || 'Main',
          color: ACCENT_COLORS[0],
        })
      } else {
        await callBackground({
          type: 'accounts.import',
          label: label.trim() || 'Main',
          color: ACCENT_COLORS[0],
          secret,
        })
      }
      onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex justify-end p-3">
        <ThemeToggle />
      </div>

      <div className="flex flex-1 flex-col justify-center gap-6 px-7 pb-10">
        <div className="flex flex-col items-center gap-4 text-center">
          <BrandMark size={60} />
          <div>
            <div className="text-xl font-bold tracking-tight">Create your identity</div>
            <div className="mt-1.5 text-[13px] text-neutral-500 dark:text-neutral-400">
              This is the key nostr sites will see and sign with.
            </div>
          </div>
          {showStepDots && (
            <div className="flex gap-1.5">
              <span className="h-1.5 w-5 rounded-full bg-neutral-300 dark:bg-neutral-700" />
              <span className="h-1.5 w-5 rounded-full bg-accent" />
            </div>
          )}
        </div>

        <Surface className="shadow-[0_2px_4px_rgba(20,22,26,0.04),0_12px_24px_rgba(20,22,26,0.08)]">
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="flex gap-1 rounded-full bg-neutral-100 p-[3px] dark:bg-neutral-800">
              <button
                type="button"
                onClick={() => setMode('create')}
                className={`flex-1 rounded-full px-2.5 py-1.5 text-[12.5px] font-semibold transition-colors ${
                  mode === 'create'
                    ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-700 dark:text-neutral-50'
                    : 'text-neutral-500 dark:text-neutral-400'
                }`}
              >
                Generate new
              </button>
              <button
                type="button"
                onClick={() => setMode('import')}
                className={`flex-1 rounded-full px-2.5 py-1.5 text-[12.5px] font-semibold transition-colors ${
                  mode === 'import'
                    ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-700 dark:text-neutral-50'
                    : 'text-neutral-500 dark:text-neutral-400'
                }`}
              >
                Import existing
              </button>
            </div>

            <div>
              <Label>Account name</Label>
              <Input value={label} onChange={(e) => setLabel(e.target.value)} autoFocus />
            </div>

            {mode === 'import' && (
              <div>
                <Label>Private key (nsec1… or hex)</Label>
                <Textarea
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  rows={2}
                  placeholder="nsec1..."
                />
              </div>
            )}

            {error && <div className="text-xs text-danger">{error}</div>}
            <Button
              variant="primary"
              type="submit"
              disabled={busy || (mode === 'import' && !secret.trim())}
              className="mt-1 w-full py-3"
            >
              {busy ? 'Creating…' : 'Finish setup'}
            </Button>
          </form>
        </Surface>
      </div>
    </div>
  )
}
