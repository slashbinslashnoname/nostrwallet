import type { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'md' | 'sm'
}

const VARIANT_CLASSES: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-accent text-white hover:bg-accent/90',
  secondary:
    'bg-white text-neutral-900 border border-neutral-200 hover:bg-neutral-50 dark:bg-neutral-800 dark:text-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-700',
  danger: 'bg-transparent text-danger hover:bg-danger-soft dark:hover:bg-danger/10',
  ghost:
    'bg-transparent text-neutral-500 hover:bg-neutral-200/60 dark:text-neutral-400 dark:hover:bg-neutral-800',
}

const SIZE_CLASSES: Record<NonNullable<ButtonProps['size']>, string> = {
  md: 'px-4 py-2.5 text-[13px]',
  sm: 'px-3 py-1.5 text-xs',
}

export function Button({
  variant = 'secondary',
  size = 'md',
  className = '',
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`rounded-full font-semibold tracking-tight whitespace-nowrap transition-colors duration-100 disabled:cursor-not-allowed disabled:opacity-45 ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      disabled={disabled}
      {...rest}
    />
  )
}

export function FabButton({ className = '', ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      aria-label="Add"
      className={`flex h-12 w-12 items-center justify-center rounded-full bg-accent text-2xl leading-none text-white shadow-[0_6px_16px_rgba(59,91,253,0.35)] transition-transform duration-100 hover:scale-105 ${className}`}
      {...rest}
    >
      +
    </button>
  )
}

export function IconButton({ className = '', ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-base text-neutral-400 transition-colors duration-100 hover:bg-neutral-200/60 dark:text-neutral-500 dark:hover:bg-neutral-800 ${className}`}
      {...rest}
    />
  )
}
