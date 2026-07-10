import { getLocal, getSession } from '../shared/storage'
import { isUnlocked, lock } from './vault/vault'

const ALARM_NAME = 'auto-lock-watchdog'
// Chrome enforces a 30s (0.5min) floor on repeating alarms for packed extensions.
const ALARM_PERIOD_MINUTES = 0.5

export function registerAutoLockAlarm(): void {
  chrome.alarms.create(ALARM_NAME, { periodInMinutes: ALARM_PERIOD_MINUTES })
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === ALARM_NAME) void checkAutoLock()
  })
}

async function checkAutoLock(): Promise<void> {
  if (!(await isUnlocked())) return

  const settings = await getLocal('settings')
  if (settings.autoLockMinutes <= 0) return // 0 = auto-lock disabled

  const lastActivityAt = (await getSession('lastActivityAt')) ?? Date.now()
  const elapsedMs = Date.now() - lastActivityAt
  if (elapsedMs >= settings.autoLockMinutes * 60_000) {
    await lock()
  }
}
