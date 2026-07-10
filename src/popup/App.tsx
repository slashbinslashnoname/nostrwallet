import { useCallback, useEffect, useState } from 'react'
import { callBackground } from '../shared/messages'
import { SetupView } from './views/SetupView'
import { UnlockView } from './views/UnlockView'
import { AccountsView } from './views/AccountsView'
import { CreateIdentityView } from './views/CreateIdentityView'

type Screen = 'loading' | 'setup' | 'locked' | 'no-accounts' | 'unlocked'

export function App() {
  const [screen, setScreen] = useState<Screen>('loading')

  const refreshStatus = useCallback(async () => {
    const status = await callBackground({ type: 'vault.status' })
    if (!status.exists) return setScreen('setup')
    if (!status.unlocked) return setScreen('locked')

    const accounts = await callBackground({ type: 'accounts.list' })
    setScreen(accounts.length === 0 ? 'no-accounts' : 'unlocked')
  }, [])

  useEffect(() => {
    void refreshStatus()
  }, [refreshStatus])

  return (
    <div className="relative flex h-[560px] w-[380px] flex-col overflow-hidden bg-neutral-100 dark:bg-neutral-950">
      {screen === 'loading' && (
        <div className="p-6 text-neutral-500 dark:text-neutral-400">Loading…</div>
      )}
      {screen === 'setup' && <SetupView onDone={refreshStatus} />}
      {screen === 'locked' && <UnlockView onUnlocked={refreshStatus} />}
      {screen === 'no-accounts' && <CreateIdentityView onDone={refreshStatus} />}
      {screen === 'unlocked' && <AccountsView onLocked={refreshStatus} onEmpty={refreshStatus} />}
    </div>
  )
}
