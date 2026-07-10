import { useState, type FormEvent } from 'react'
import { callBackground } from '../../shared/messages'
import { BrandMark } from '../../shared/ui/Brand'
import { Button } from '../../shared/ui/Button'
import { Input, Label } from '../../shared/ui/Input'
import { Surface } from '../../shared/ui/Surface'
import { ThemeToggle } from '../../shared/ui/ThemeToggle'
import { CreateIdentityView } from './CreateIdentityView'

export function SetupView({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState<'password' | 'account'>('password')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleCreateVault(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (password.length < 8) return setError('Use at least 8 characters')
    if (password !== confirm) return setError('Passwords do not match')

    setBusy(true)
    try {
      await callBackground({ type: 'vault.create', password })
      setStep('account')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  if (step === 'account') {
    return <CreateIdentityView onDone={onDone} showStepDots />
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
            <div className="text-xl font-bold tracking-tight">Welcome to NostrWallet</div>
            <div className="mt-1.5 text-[13px] text-neutral-500 dark:text-neutral-400">
              Set a password to encrypt your keys on this device.
            </div>
          </div>
          <div className="flex gap-1.5">
            <span className="h-1.5 w-5 rounded-full bg-accent" />
            <span className="h-1.5 w-5 rounded-full bg-neutral-300 dark:bg-neutral-700" />
          </div>
        </div>

        <Surface className="shadow-[0_2px_4px_rgba(20,22,26,0.04),0_12px_24px_rgba(20,22,26,0.08)]">
          <form onSubmit={handleCreateVault} className="flex flex-col gap-3">
            <div>
              <Label>Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                placeholder="At least 8 characters"
              />
            </div>
            <div>
              <Label>Confirm password</Label>
              <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </div>
            {error && <div className="text-xs text-danger">{error}</div>}
            <Button variant="primary" type="submit" disabled={busy} className="mt-1 w-full py-3">
              {busy ? 'Creating…' : 'Continue'}
            </Button>
          </form>
        </Surface>
      </div>
    </div>
  )
}
