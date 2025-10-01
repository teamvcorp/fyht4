'use client'

import React from 'react'
import { Button } from '@/components/Button'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<{ error?: Error; reset: () => void }> },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const Fallback = this.props.fallback
        return <Fallback error={this.state.error} reset={() => this.setState({ hasError: false })} />
      }

      return (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <h2 className="text-lg font-semibold text-red-900 mb-2">Something went wrong</h2>
          <p className="text-red-700 mb-4">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <div className="flex justify-center gap-3">
            <Button
              onClick={() => this.setState({ hasError: false })}
              className="bg-red-600 hover:bg-red-700"
            >
              Try again
            </Button>
            <Button
              href="/"
              invert
            >
              Go home
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export function SimpleErrorFallback({ error, reset }: { error?: Error; reset: () => void }) {
  return (
    <div className="text-center p-8">
      <h2 className="text-lg font-semibold text-neutral-900 mb-2">Oops! Something went wrong</h2>
      <p className="text-neutral-600 mb-4">Please try refreshing the page or contact support if the problem persists.</p>
      <Button onClick={reset}>Try again</Button>
    </div>
  )
}