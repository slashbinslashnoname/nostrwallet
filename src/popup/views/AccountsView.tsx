import { useEffect, useState, type FormEvent } from 'react'
import { nip19 } from 'nostr-tools'
import type { Account, AccentColor } from '../../shared/types'
import { callBackground } from '../../shared/messages'
import { Button, FabButton, IconButton } from '../../shared/ui/Button'
import { Input, Label, Textarea } from '../../shared/ui/Input'
import { Menu } from '../../shared/ui/Menu'
import { MonoText } from '../../shared/ui/MonoText'
import { Surface } from '../../shared/ui/Surface'
import { ThemeToggle } from '../../shared/ui/ThemeToggle'
import { SettingsView } from './SettingsView'

const ACCENT_COLORS: AccentColor[] = ['blue', 'violet', 'green', 'amber', 'rose']
const ACCENT_CLASSES: Record<AccentColor, string> = {
  blue: 'bg-[#3b5bfd]',
  violet: 'bg-[#8b5cf6]',
  green: 'bg-[#16a34a]',
  amber: 'bg-[#d97706]',
  rose: 'bg-[#e0245e]',
}

export function AccountsView({
  onLocked,
  onEmpty,
}: {
  onLocked: () => void
  /** Called after a refresh finds zero accounts left (e.g. the last one was
   * deleted), so the parent can switch to the "create your first identity"
   * screen instead of showing an empty list. */
  onEmpty: () => void
}) {
  const [accounts, setAccounts] = useState<Account[] | null>(null)
  const [adding, setAdding] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [switching, setSwitching] = useState(false)

  async function refresh() {
    const list = await callBackground({ type: 'accounts.list' })
    setAccounts(list)
    if (list.length === 0) onEmpty()
  }

  useEffect(() => {
    void refresh()
  }, [])

  async function handleLock() {
    await callBackground({ type: 'vault.lock' })
    onLocked()
  }

  if (showSettings) {
    return <SettingsView onBack={() => setShowSettings(false)} />
  }

  async function handleSelectDefault(id: string) {
    setSwitching(true)
    try {
      await callBackground({ type: 'accounts.setDefault', id })
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSwitching(false)
    }
  }

  return (
    <div className="flex h-full flex-col bg-neutral-100 dark:bg-neutral-950">
      <div className="flex items-center justify-between px-5 pt-[18px] pb-3">
        {adding ? (
          <div className="text-lg font-bold tracking-tight">Add identity</div>
        ) : accounts && accounts.length > 0 ? (
          <IdentityPicker accounts={accounts} busy={switching} onSelect={handleSelectDefault} />
        ) : (
          <div className="text-lg font-bold tracking-tight">Identities</div>
        )}
        <div className="flex items-center gap-1">
          <IconButton aria-label="Settings" onClick={() => setShowSettings(true)}>
            <SettingsIcon />
          </IconButton>
          <ThemeToggle />
          <Button variant="ghost" size="sm" onClick={() => void handleLock()}>
            Lock
          </Button>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-5 pt-1 pb-[84px]">
        {error && (
          <div className="rounded-lg bg-danger-soft px-2.5 py-2 text-xs text-danger">{error}</div>
        )}

        {adding ? (
          <AddAccountForm
            onDone={() => {
              setAdding(false)
              void refresh()
            }}
            onCancel={() => setAdding(false)}
            onError={setError}
          />
        ) : (
          <>
            {accounts === null && (
              <div className="px-0.5 py-3 text-[13px] text-neutral-500 dark:text-neutral-400">
                Loading…
              </div>
            )}

            {accounts?.length === 0 && (
              <div className="px-1 py-6 text-center text-[13px] text-neutral-500 dark:text-neutral-400">
                No identities yet — add one below.
              </div>
            )}

            {accounts?.map((account) => (
              <AccountCard
                key={account.id}
                account={account}
                onChanged={() => {
                  setError(null)
                  void refresh()
                }}
                onError={setError}
              />
            ))}
          </>
        )}
      </div>

      {!adding && (
        <div className="absolute right-5 bottom-5">
          <FabButton onClick={() => setAdding(true)} />
        </div>
      )}
    </div>
  )
}

function Avatar({
  label,
  color,
  size = 38,
}: {
  label: string
  color: AccentColor
  size?: number
}) {
  const initial = (label.trim()[0] ?? '?').toUpperCase()
  return (
    <div
      title={label}
      className={`flex shrink-0 items-center justify-center rounded-full font-bold text-white ${ACCENT_CLASSES[color]}`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initial}
    </div>
  )
}

function ChevronDownIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"
      />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />
    </svg>
  )
}

function IdentityPicker({
  accounts,
  busy,
  onSelect,
}: {
  accounts: Account[]
  busy: boolean
  onSelect: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const current = accounts.find((a) => a.isDefault) ?? accounts[0]
  if (!current) return null

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Switch identity"
        disabled={busy}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full py-1 pr-3 pl-1 text-neutral-900 transition-colors hover:bg-neutral-200/60 disabled:cursor-not-allowed dark:text-neutral-50 dark:hover:bg-neutral-800"
      >
        <Avatar label={current.label} color={current.color} size={30} />
        <span className="text-sm font-semibold">{current.label}</span>
        <ChevronDownIcon />
      </button>

      {open && (
        <>
          <div onClick={() => setOpen(false)} className="fixed inset-0 z-10" />
          <div className="absolute top-[calc(100%+2px)] left-0 z-20 min-w-[220px] rounded-2xl border border-neutral-200 bg-white p-1.5 shadow-[0_2px_4px_rgba(20,22,26,0.04),0_12px_24px_rgba(20,22,26,0.08)] dark:border-neutral-700 dark:bg-neutral-800">
            {accounts.map((account) => (
              <button
                key={account.id}
                type="button"
                onClick={() => {
                  setOpen(false)
                  if (!account.isDefault) onSelect(account.id)
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left hover:bg-neutral-100 dark:hover:bg-neutral-700"
              >
                <Avatar label={account.label} color={account.color} size={26} />
                <span className="flex-1 truncate text-sm font-medium">{account.label}</span>
                {account.isDefault && <span className="text-accent"><CheckIcon /></span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function AccountCard({
  account,
  onChanged,
  onError,
}: {
  account: Account
  onChanged: () => void
  onError: (message: string) => void
}) {
  const [renaming, setRenaming] = useState(false)
  const [label, setLabel] = useState(account.label)
  const [revealedNsec, setRevealedNsec] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [colorPickerOpen, setColorPickerOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const npub = nip19.npubEncode(account.pubkey)

  async function run(fn: () => Promise<void>) {
    setBusy(true)
    try {
      await fn()
    } catch (err) {
      onError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Surface primary={account.isDefault}>
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <button
              type="button"
              aria-label="Change color"
              onClick={() => setColorPickerOpen((v) => !v)}
              className="block rounded-full"
            >
              <Avatar label={account.label} color={account.color} />
            </button>
            {colorPickerOpen && (
              <>
                <div onClick={() => setColorPickerOpen(false)} className="fixed inset-0 z-10" />
                <div className="absolute top-[calc(100%+6px)] left-0 z-20 flex gap-1.5 rounded-2xl border border-neutral-200 bg-white p-2 shadow-[0_2px_4px_rgba(20,22,26,0.04),0_12px_24px_rgba(20,22,26,0.08)] dark:border-neutral-700 dark:bg-neutral-800">
                  {ACCENT_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      aria-label={c}
                      disabled={busy}
                      onClick={() => {
                        setColorPickerOpen(false)
                        void run(async () => {
                          await callBackground({ type: 'accounts.setColor', id: account.id, color: c })
                          onChanged()
                        })
                      }}
                      className={`h-6 w-6 rounded-full ${ACCENT_CLASSES[c]} ${
                        account.color === c
                          ? 'ring-2 ring-neutral-900 ring-offset-2 dark:ring-neutral-50 dark:ring-offset-neutral-900'
                          : ''
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="min-w-0 flex-1">
            {renaming ? (
              <Input
                autoFocus
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="px-2 py-1 text-sm font-semibold"
              />
            ) : (
              <>
                <div className="text-[15px] font-semibold tracking-tight">{account.label}</div>
                <MonoText truncate className="text-[11.5px] text-neutral-400 dark:text-neutral-500">
                  {npub}
                </MonoText>
              </>
            )}
          </div>

          {account.isDefault && !renaming && (
            <span className="shrink-0 rounded-full bg-success-soft px-2.5 py-0.5 text-[11px] font-semibold text-success">
              Active
            </span>
          )}

          {!renaming && (
            <div className="relative">
              <IconButton
                aria-label="More actions"
                onClick={() => setMenuOpen((v) => !v)}
                className={menuOpen ? 'bg-neutral-200/60 dark:bg-neutral-800' : ''}
              >
                ⋯
              </IconButton>
              <Menu
                open={menuOpen}
                onClose={() => setMenuOpen(false)}
                items={[
                  { label: 'Rename', onClick: () => setRenaming(true) },
                  {
                    label: revealedNsec ? 'Hide private key' : 'Export private key',
                    onClick: () =>
                      run(async () => {
                        if (revealedNsec) return setRevealedNsec(null)
                        const { nsec } = await callBackground({
                          type: 'accounts.exportNsec',
                          id: account.id,
                        })
                        setRevealedNsec(nsec)
                      }),
                  },
                  {
                    label: 'Delete',
                    danger: true,
                    onClick: () =>
                      run(async () => {
                        if (!confirm(`Delete "${account.label}"? This cannot be undone.`)) return
                        await callBackground({ type: 'accounts.delete', id: account.id })
                        onChanged()
                      }),
                  },
                ]}
              />
            </div>
          )}
        </div>

        {renaming && (
          <div className="flex gap-1.5">
            <Button
              size="sm"
              variant="primary"
              disabled={busy}
              onClick={() =>
                run(async () => {
                  await callBackground({ type: 'accounts.rename', id: account.id, label })
                  setRenaming(false)
                  onChanged()
                })
              }
            >
              Save
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setLabel(account.label)
                setRenaming(false)
              }}
            >
              Cancel
            </Button>
          </div>
        )}

        {revealedNsec && (
          <div className="rounded-xl bg-neutral-100 p-2.5 dark:bg-neutral-800">
            <div className="mb-1 text-[11px] text-danger">
              Keep this secret — anyone with it controls this identity.
            </div>
            <MonoText className="text-xs break-all">{revealedNsec}</MonoText>
          </div>
        )}
      </div>
    </Surface>
  )
}

function AddAccountForm({
  onDone,
  onCancel,
  onError,
}: {
  onDone: () => void
  onCancel: () => void
  onError: (message: string) => void
}) {
  const [mode, setMode] = useState<'create' | 'import'>('create')
  const [label, setLabel] = useState('')
  const [color, setColor] = useState<AccentColor>(ACCENT_COLORS[0]!)
  const [secret, setSecret] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      if (mode === 'create') {
        await callBackground({
          type: 'accounts.create',
          label: label.trim() || 'New identity',
          color,
        })
      } else {
        await callBackground({
          type: 'accounts.import',
          label: label.trim() || 'Imported identity',
          color,
          secret,
        })
      }
      onDone()
    } catch (err) {
      onError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Surface>
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
          <Label>Name</Label>
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Personal"
            autoFocus
          />
        </div>

        <div>
          <Label>Color</Label>
          <div className="flex gap-2">
            {ACCENT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={c}
                onClick={() => setColor(c)}
                className={`h-6 w-6 rounded-full ${ACCENT_CLASSES[c]} ${
                  color === c
                    ? 'ring-2 ring-neutral-900 ring-offset-2 dark:ring-neutral-50 dark:ring-offset-neutral-900'
                    : 'ring-1 ring-neutral-200 dark:ring-neutral-700'
                }`}
              />
            ))}
          </div>
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

        <div className="flex gap-2">
          <Button
            variant="primary"
            type="submit"
            disabled={busy || (mode === 'import' && !secret.trim())}
            className="flex-1"
          >
            {busy ? 'Adding…' : 'Add identity'}
          </Button>
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Surface>
  )
}
