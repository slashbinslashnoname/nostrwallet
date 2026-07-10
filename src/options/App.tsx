import { useState } from 'react'
import { ThemeToggle } from '../shared/ui/ThemeToggle'
import { SecuritySettingsView } from './views/SecuritySettingsView'
import { PermissionsView } from './views/PermissionsView'

const TABS = [
  { key: 'security', label: 'Security' },
  { key: 'permissions', label: 'Site permissions' },
] as const

type TabKey = (typeof TABS)[number]['key']

export function App() {
  const [tab, setTab] = useState<TabKey>('security')

  return (
    <div className="mx-auto max-w-xl px-6 py-8">
      <div className="mb-5 flex items-center justify-between">
        <div className="text-xl font-bold tracking-tight">Settings</div>
        <ThemeToggle />
      </div>

      <div className="mb-5 flex gap-1 border-b border-neutral-200 dark:border-neutral-800">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`-mb-px border-b-2 px-3 py-2 text-[13px] font-semibold transition-colors ${
              tab === t.key
                ? 'border-accent text-accent'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'security' && <SecuritySettingsView />}
      {tab === 'permissions' && <PermissionsView />}
    </div>
  )
}
