interface MenuItem {
  label: string
  onClick: () => void
  danger?: boolean
}

/** A small right-aligned dropdown. Render inside a `relative` wrapper
 * alongside the trigger button that toggles `open`. */
export function Menu({
  open,
  onClose,
  items,
}: {
  open: boolean
  onClose: () => void
  items: MenuItem[]
}) {
  if (!open) return null

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-10" />
      <div className="absolute top-[calc(100%+6px)] right-0 z-20 min-w-[168px] rounded-2xl border border-neutral-200 bg-white p-1.5 shadow-[0_2px_4px_rgba(20,22,26,0.04),0_12px_24px_rgba(20,22,26,0.08)] dark:border-neutral-700 dark:bg-neutral-800">
        {items.map((item) => (
          <button
            key={item.label}
            onClick={() => {
              item.onClick()
              onClose()
            }}
            className={`block w-full rounded-lg px-2.5 py-2 text-left text-[13px] font-medium hover:bg-neutral-100 dark:hover:bg-neutral-700 ${
              item.danger ? 'text-danger' : 'text-neutral-900 dark:text-neutral-50'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </>
  )
}
