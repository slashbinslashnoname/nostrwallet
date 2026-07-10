import { useEffect, useState } from 'react'
import type { Nip07Permission } from '../../shared/types'
import { callBackground } from '../../shared/messages'
import { Button } from '../../shared/ui/Button'
import { MonoText } from '../../shared/ui/MonoText'
import { Surface } from '../../shared/ui/Surface'

const METHOD_LABEL: Record<Nip07Permission['method'], string> = {
  getPublicKey: 'Read public key',
  getRelays: 'Read relay list',
  signEvent: 'Sign event',
  'nip04.encrypt': 'Encrypt (nip04)',
  'nip04.decrypt': 'Decrypt (nip04)',
  'nip44.encrypt': 'Encrypt (nip44)',
  'nip44.decrypt': 'Decrypt (nip44)',
}

function expiryLabel(permission: Nip07Permission): string {
  if (permission.expiresAt === undefined) return 'Always'
  const daysLeft = Math.ceil((permission.expiresAt - Date.now()) / (24 * 60 * 60 * 1000))
  return daysLeft > 0 ? `Expires in ${daysLeft}d` : 'Expired'
}

export function PermissionsView() {
  const [permissions, setPermissions] = useState<Nip07Permission[] | null>(null)

  async function refresh() {
    setPermissions(await callBackground({ type: 'permissions.nip07.list' }))
  }

  useEffect(() => {
    void refresh()
  }, [])

  if (permissions === null) return null

  if (permissions.length === 0) {
    return (
      <Surface>
        <div className="text-[13px] text-neutral-500 dark:text-neutral-400">
          No site permissions yet. They appear here once a site requests something and you
          choose "remember this choice".
        </div>
      </Surface>
    )
  }

  const byOrigin = new Map<string, Nip07Permission[]>()
  for (const permission of permissions) {
    const rows = byOrigin.get(permission.origin) ?? []
    rows.push(permission)
    byOrigin.set(permission.origin, rows)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button
          size="sm"
          variant="danger"
          onClick={() => {
            if (!confirm('Clear all remembered site permissions? Sites will ask again next time.'))
              return
            void callBackground({ type: 'permissions.nip07.clearAll' }).then(refresh)
          }}
        >
          Clear all
        </Button>
      </div>

      {[...byOrigin.entries()].map(([origin, rows]) => (
        <Surface key={origin}>
          <div className="mb-2.5 text-sm font-semibold">{origin}</div>
          <div className="flex flex-col gap-2">
            {rows.map((permission) => (
              <div key={permission.id} className="flex items-center justify-between gap-2">
                <div className="text-[13px]">
                  {METHOD_LABEL[permission.method]}
                  {permission.method === 'signEvent' && permission.eventKind !== undefined && (
                    <MonoText className="ml-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                      {`kind ${permission.eventKind}`}
                    </MonoText>
                  )}
                  <div className="mt-0.5 text-[11px] text-neutral-400 dark:text-neutral-500">
                    {expiryLabel(permission)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      permission.decision === 'allow'
                        ? 'bg-success-soft text-success'
                        : 'bg-danger-soft text-danger'
                    }`}
                  >
                    {permission.decision === 'allow' ? 'Allowed' : 'Denied'}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      void callBackground({
                        type: 'permissions.nip07.revoke',
                        id: permission.id,
                      }).then(refresh)
                    }
                  >
                    Revoke
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Surface>
      ))}
    </div>
  )
}
