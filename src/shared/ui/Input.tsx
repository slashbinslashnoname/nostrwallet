import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react'

const FIELD_CLASSES =
  'w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-[13px] text-neutral-900 outline-none focus:border-accent dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-50'

export function Input({ className = '', ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${FIELD_CLASSES} ${className}`} {...rest} />
}

export function Textarea({
  className = '',
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`${FIELD_CLASSES} resize-y font-mono ${className}`}
      {...rest}
    />
  )
}

export function Label({ children }: { children: ReactNode }) {
  return (
    <label className="mb-1 block text-xs font-semibold text-neutral-500 dark:text-neutral-400">
      {children}
    </label>
  )
}
