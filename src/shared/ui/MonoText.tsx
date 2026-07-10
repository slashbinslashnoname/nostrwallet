import type { HTMLAttributes } from 'react'

interface MonoTextProps extends HTMLAttributes<HTMLSpanElement> {
  /** Truncate a long hex/bech32 string to "first8…last8" for display. Only
   * applies when `children` is a plain string. */
  truncate?: boolean
}

export function MonoText({ children, truncate, className = '', ...rest }: MonoTextProps) {
  const spanClassName = `font-mono text-[12.5px] text-neutral-900 dark:text-neutral-50 ${className}`

  if (typeof children !== 'string') {
    return (
      <span className={spanClassName} {...rest}>
        {children}
      </span>
    )
  }

  const display =
    truncate && children.length > 20 ? `${children.slice(0, 8)}…${children.slice(-8)}` : children

  return (
    <span className={spanClassName} title={truncate ? children : undefined} {...rest}>
      {display}
    </span>
  )
}
