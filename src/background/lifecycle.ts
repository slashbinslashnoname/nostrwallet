import { ensureSessionAccessLevel } from '../shared/storage'
import { registerAutoLockAlarm } from './auto-lock'

let initialized = false

export function registerLifecycle(): void {
  chrome.runtime.onInstalled.addListener(() => void init())
  chrome.runtime.onStartup.addListener(() => void init())
  // Also run on module load: the service worker can be spun up by an
  // incoming message/alarm without onInstalled/onStartup firing again.
  void init()
}

async function init(): Promise<void> {
  if (initialized) return
  initialized = true
  await ensureSessionAccessLevel()
  registerAutoLockAlarm()
}
