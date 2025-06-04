import { useId } from 'react'
import clsx from 'clsx'




export function Logo({
  className,
  invert = false,
  filled = false,
  fillOnHover = false,
  ...props
}: React.ComponentPropsWithoutRef<'svg'> & {
  invert?: boolean;
  filled?: boolean;
  fillOnHover?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 130 32"
      aria-hidden="true"
      className={clsx(fillOnHover && 'group/logo', className)}
      {...props}
    >
      <text
        x="10"
        y="22"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="20"
        fontWeight="500"
        className={invert ? 'fill-white' : 'fill-neutral-950'}
      >
        FYHT4
      </text>
    </svg>
  )
}
