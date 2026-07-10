import { IconButton } from './Button'
import { useTheme } from './useTheme'

const LABEL = { light: 'Light theme', dark: 'Dark theme', system: 'System theme' } as const

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="4.5" />
      <path
        strokeLinecap="round"
        d="M12 2.5v2.5M12 19v2.5M4.5 12H2M22 12h-2.5M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8"
      />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z" />
    </svg>
  )
}

function SystemIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4.5" width="18" height="12" rx="2" />
      <path strokeLinecap="round" d="M8 20h8M12 16.5V20" />
    </svg>
  )
}

const ICON = { light: SunIcon, dark: MoonIcon, system: SystemIcon }

export function ThemeToggle() {
  const { theme, cycleTheme } = useTheme()
  const Icon = ICON[theme]

  return (
    <IconButton aria-label={`Theme: ${LABEL[theme]}. Click to change.`} onClick={cycleTheme}>
      <Icon />
    </IconButton>
  )
}
