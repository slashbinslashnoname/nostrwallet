import { useCallback, useEffect, useState } from 'react'
import type { ThemePreference } from '../types'
import { callBackground } from '../messages'
import { applyTheme } from './theme'

const NEXT: Record<ThemePreference, ThemePreference> = {
  light: 'dark',
  dark: 'system',
  system: 'light',
}

export function useTheme() {
  const [theme, setTheme] = useState<ThemePreference>('system')

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const settings = await callBackground({ type: 'settings.get' })
      if (cancelled) return
      setTheme(settings.theme)
      applyTheme(settings.theme)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      setTheme((current) => {
        if (current === 'system') applyTheme('system')
        return current
      })
    }
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  const cycleTheme = useCallback(() => {
    setTheme((current) => {
      const next = NEXT[current]
      applyTheme(next)
      void callBackground({ type: 'settings.update', settings: { theme: next } })
      return next
    })
  }, [])

  return { theme, cycleTheme }
}
