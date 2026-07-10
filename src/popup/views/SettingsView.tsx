import { useState } from 'react'
import { Button } from '../../shared/ui/Button'
import { ThemeToggle } from '../../shared/ui/ThemeToggle'
import { SecuritySettingsView } from '../../options/views/SecuritySettingsView'
import { PermissionsView } from '../../options/views/PermissionsView'

const TABS = [
  { key: 'security', label: 'Security' },
  { key: 'permissions', label: 'Sites' },
] as const

type TabKey = (typeof TABS)[number]['key']

function BackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="m15 18-6-6 6-6" />
    </svg>
  )
}

export function SettingsView({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState<TabKey>('security')

  return (
    <div className="flex h-full flex-col bg-neutral-100 dark:bg-neutral-950">
      <div className="flex items-center justify-between px-3 pt-[14px] pb-2">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={onBack} className="!px-2">
            <BackIcon />
          </Button>
          <div className="text-lg font-bold tracking-tight">Settings</div>
        </div>
        <ThemeToggle />
      </div>

      <div className="mx-5 mb-2 flex gap-1 rounded-full bg-neutral-200/60 p-[3px] dark:bg-neutral-800">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 rounded-full px-2 py-1.5 text-[12.5px] font-semibold transition-colors ${
              tab === t.key
                ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-700 dark:text-neutral-50'
                : 'text-neutral-500 dark:text-neutral-400'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-5">
        {tab === 'security' && <SecuritySettingsView />}
        {tab === 'permissions' && <PermissionsView />}
      </div>
    </div>
  )
}
