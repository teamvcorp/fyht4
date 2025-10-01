import clsx from 'clsx'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8', 
    lg: 'h-12 w-12'
  }

  return (
    <div className={clsx('flex items-center justify-center', className)}>
      <svg 
        className={clsx('animate-spin text-neutral-600', sizeClasses[size])}
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
    </div>
  )
}

export function LoadingCard({ children, className }: { children?: React.ReactNode, className?: string }) {
  return (
    <div className={clsx('rounded-2xl border border-neutral-200 bg-white p-6 text-center', className)}>
      <LoadingSpinner className="mb-4" />
      {children || <p className="text-neutral-600">Loading...</p>}
    </div>
  )
}

export function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-3xl border border-neutral-200 bg-white p-5">
      <div className="h-40 w-full rounded-2xl bg-neutral-200 mb-4"></div>
      <div className="space-y-2">
        <div className="h-4 bg-neutral-200 rounded w-3/4"></div>
        <div className="h-4 bg-neutral-200 rounded w-1/2"></div>
        <div className="h-3 bg-neutral-200 rounded w-full"></div>
        <div className="h-3 bg-neutral-200 rounded w-5/6"></div>
      </div>
    </div>
  )
}