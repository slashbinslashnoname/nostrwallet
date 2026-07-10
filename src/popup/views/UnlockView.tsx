import { useState, type FormEvent } from 'react'
import { callBackground } from '../../shared/messages'
import { BrandMark } from '../../shared/ui/Brand'
import { Button } from '../../shared/ui/Button'
import { Input, Label } from '../../shared/ui/Input'
import { Surface } from '../../shared/ui/Surface'
import { ThemeToggle } from '../../shared/ui/ThemeToggle'

export function UnlockView({ onUnlocked }: { onUnlocked: () => void }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await callBackground({ type: 'vault.unlock', password })
      onUnlocked()
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
        <div className="flex flex-col items-center gap-3 text-center">
          <BrandMark size={52} />
          <div>
            <div className="text-xl font-bold tracking-tight">Welcome back</div>
            <div className="mt-1 text-[13px] text-neutral-500 dark:text-neutral-400">
              Enter your password to unlock your identities.
            </div>
          </div>
        </div>

        <Surface className="shadow-[0_2px_4px_rgba(20,22,26,0.04),0_12px_24px_rgba(20,22,26,0.08)]">
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div>
              <Label>Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
            </div>
            {error && <div className="text-xs text-danger">{error}</div>}
            <Button
              variant="primary"
              type="submit"
              disabled={busy || !password}
              className="mt-1 w-full py-3"
            >
              {busy ? 'Unlocking…' : 'Unlock'}
            </Button>
          </form>
        </Surface>
      </div>
    </div>
  )
}
