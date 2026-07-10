import type { HTMLAttributes, ReactNode } from 'react'

interface SurfaceProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  /** Marks this as the single active/primary card in a list — carries a
   * solid accent border. Use on at most one item at a time. */
  primary?: boolean
}

const BASE_CARD_CLASSES =
  'rounded-3xl border bg-white shadow-[0_1px_1px_rgba(20,22,26,0.02),0_6px_16px_rgba(20,22,26,0.05)] dark:bg-neutral-900'

export function Surface({ children, primary, className = '', ...rest }: SurfaceProps) {
  const borderClasses = primary
    ? 'border-2 border-accent'
    : 'border-neutral-200 dark:border-neutral-800'

  return (
    <div className={`${BASE_CARD_CLASSES} ${borderClasses} p-4 ${className}`} {...rest}>
      {children}
    </div>
  )
}
