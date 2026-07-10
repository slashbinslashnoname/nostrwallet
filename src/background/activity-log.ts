import type { ActivityLogEntry } from '../shared/types'
import { getLocal, setLocal } from '../shared/storage'

const ACTIVITY_LOG_CAP = 2000

export async function appendActivity(entry: Omit<ActivityLogEntry, 'id' | 'ts'>): Promise<void> {
  const log = await getLocal('activityLog')
  const full: ActivityLogEntry = { ...entry, id: crypto.randomUUID(), ts: Date.now() }
  const next = [full, ...log].slice(0, ACTIVITY_LOG_CAP)
  await setLocal('activityLog', next)
}
