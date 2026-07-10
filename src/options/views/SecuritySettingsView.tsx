import { useEffect, useState, type FormEvent } from 'react'
import type { Settings } from '../../shared/types'
import { callBackground, type VaultStatus } from '../../shared/messages'
import { Button } from '../../shared/ui/Button'
import { Input, Label } from '../../shared/ui/Input'
import { Surface } from '../../shared/ui/Surface'

const AUTO_LOCK_OPTIONS = [
  { value: 1, label: '1 minute' },
  { value: 5, label: '5 minutes' },
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 60, label: '1 hour' },
  { value: 0, label: 'Never' },
]

export function SecuritySettingsView() {
  const [status, setStatus] = useState<VaultStatus | null>(null)
  const [settings, setSettings] = useState<Settings | null>(null)

  useEffect(() => {
    void (async () => {
      setStatus(await callBackground({ type: 'vault.status' }))
      setSettings(await callBackground({ type: 'settings.get' }))
    })()
  }, [])

  if (!status) return null

  if (!status.exists) {
    return (
      <Surface>
        <div className="text-[13px] text-neutral-500 dark:text-neutral-400">
          Open the extension's toolbar popup to create your vault first.
        </div>
      </Surface>
    )
  }

  if (!status.unlocked) {
    return (
      <Surface>
        <div className="text-[13px] text-neutral-500 dark:text-neutral-400">
          Your vault is locked. Unlock it from the toolbar popup to manage security settings.
        </div>
      </Surface>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {settings && (
        <Surface>
          <div className="mb-2.5 text-sm font-semibold">Auto-lock</div>
          <Label>Lock the vault after inactivity</Label>
          <select
            value={settings.autoLockMinutes}
            onChange={(e) => {
              const autoLockMinutes = Number(e.target.value)
              setSettings({ ...settings, autoLockMinutes })
              void callBackground({ type: 'settings.update', settings: { autoLockMinutes } })
            }}
            className="rounded-xl border border-neutral-200 bg-white px-2.5 py-2 text-[13px] text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-50"
          >
            {AUTO_LOCK_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </Surface>
      )}

      <ChangePasswordForm />
    </div>
  )
}

function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    if (newPassword.length < 8) return setError('Use at least 8 characters')
    if (newPassword !== confirm) return setError('New passwords do not match')

    setBusy(true)
    try {
      await callBackground({ type: 'vault.changePassword', currentPassword, newPassword })
      setCurrentPassword('')
      setNewPassword('')
      setConfirm('')
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Surface>
      <div className="mb-2.5 text-sm font-semibold">Change password</div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
        <div>
          <Label>Current password</Label>
          <Input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </div>
        <div>
          <Label>New password</Label>
          <Input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>
        <div>
          <Label>Confirm new password</Label>
          <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </div>
        {error && <div className="text-xs text-danger">{error}</div>}
        {success && <div className="text-xs text-success">Password updated.</div>}
        <Button variant="primary" type="submit" disabled={busy} className="self-start">
          {busy ? 'Updating…' : 'Update password'}
        </Button>
      </form>
    </Surface>
  )
}
