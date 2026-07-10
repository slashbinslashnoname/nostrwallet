/** Renders the same mark used for the extension's toolbar/store icon
 * (public/icons/icon-128.png), so onboarding/lock screens match the icon
 * users already see in their browser toolbar. */
export function BrandMark({ size = 56 }: { size?: number }) {
  return (
    <img
      src="/icons/icon-128.png"
      alt=""
      className="mx-auto"
      style={{ width: size, height: size }}
    />
  )
}
