import Link from 'next/link'
import clsx from 'clsx'

type ButtonProps = {
  invert?: boolean
  loading?: boolean
  disabled?: boolean
  variant?: 'primary' | 'secondary'
} & (
  | React.ComponentPropsWithoutRef<typeof Link>
  | (React.ComponentPropsWithoutRef<'button'> & { href?: undefined })
)

export function Button({
  invert = false,
  loading = false,
  disabled = false,
  variant = 'primary',
  className,
  children,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading

  className = clsx(
    className,
    'inline-flex items-center justify-center rounded-full px-4 py-1.5 text-sm font-semibold transition relative',
    // Primary variant
    variant === 'primary' && !invert && 'bg-neutral-950 text-white hover:bg-neutral-800',
    variant === 'primary' && invert && 'bg-white text-neutral-950 hover:bg-neutral-200',
    // Secondary variant
    variant === 'secondary' && 'border border-neutral-300 bg-white text-neutral-700 hover:border-neutral-500 hover:bg-neutral-50',
    isDisabled && 'opacity-50 cursor-not-allowed',
  )

  let inner = (
    <>
      {loading && (
        <svg 
          className="animate-spin -ml-1 mr-2 h-4 w-4" 
          fill="none" 
          viewBox="0 0 24 24"
        >
          <circle 
            className="opacity-25" 
            cx="12" 
            cy="12" 
            r="10" 
            stroke="currentColor" 
            strokeWidth="4"
          />
          <path 
            className="opacity-75" 
            fill="currentColor" 
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      <span className="relative top-px">{children}</span>
    </>
  )

  if (typeof props.href === 'undefined') {
    return (
      <button 
        className={className} 
        disabled={isDisabled}
        {...props}
      >
        {inner}
      </button>
    )
  }

  if (isDisabled) {
    return (
      <span className={className}>
        {inner}
      </span>
    )
  }

  return (
    <Link className={className} {...props}>
      {inner}
    </Link>
  )
}
