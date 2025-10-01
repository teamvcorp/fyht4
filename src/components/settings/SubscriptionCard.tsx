'use client'

import { useState } from 'react'
import { Button } from '@/components/Button'

interface SubscriptionCardProps {
  hasActiveSubscription: boolean
  subscriptionStatus: string
  nextBilling?: Date | null
  amount: number
  currency: string
  interval: string
  customerId?: string | null
}

export function SubscriptionCard({
  hasActiveSubscription,
  subscriptionStatus,
  nextBilling,
  amount,
  currency,
  interval,
  customerId,
}: SubscriptionCardProps) {
  const [isLoading, setIsLoading] = useState(false)

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(date))
  }

  const handleManageSubscription = async () => {
    if (!customerId) {
      window.location.href = '/membership'
      return
    }

    setIsLoading(true)
    try {
      // Create Stripe Customer Portal session
      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId,
          returnUrl: window.location.origin + '/settings',
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create portal session')
      }

      const { url } = await response.json()
      window.location.href = url
    } catch (error) {
      console.error('Error creating portal session:', error)
      // Fallback to membership page
      window.location.href = '/membership'
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-emerald-600 bg-emerald-50'
      case 'trialing':
        return 'text-blue-600 bg-blue-50'
      case 'past_due':
        return 'text-amber-600 bg-amber-50'
      case 'canceled':
        return 'text-red-600 bg-red-50'
      default:
        return 'text-neutral-600 bg-neutral-50'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active'
      case 'trialing':
        return 'Trial Period'
      case 'past_due':
        return 'Payment Due'
      case 'canceled':
        return 'Canceled'
      case 'incomplete':
        return 'Incomplete'
      default:
        return 'No Subscription'
    }
  }

  return (
    <div className="space-y-4">
      {hasActiveSubscription ? (
        <>
          {/* Current Subscription */}
          <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-2xl">
            <div>
              <div className="flex items-center gap-3">
                <h3 className="font-semibold text-neutral-900">Monthly Membership</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(subscriptionStatus)}`}>
                  {getStatusText(subscriptionStatus)}
                </span>
              </div>
              <p className="text-sm text-neutral-600 mt-1">
                {formatPrice(amount, currency)}/{interval}
              </p>
              {nextBilling && (
                <p className="text-sm text-neutral-500 mt-1">
                  Next billing: {formatDate(nextBilling)}
                </p>
              )}
            </div>
            <div className="text-right">
              <Button
                variant="secondary"
                onClick={handleManageSubscription}
                disabled={isLoading}
              >
                {isLoading ? 'Loading...' : 'Manage'}
              </Button>
            </div>
          </div>

          {/* Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3 h-3 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-neutral-900">Submit Proposals</h4>
                <p className="text-sm text-neutral-600">Create project proposals for your community</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3 h-3 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-neutral-900">Priority Support</h4>
                <p className="text-sm text-neutral-600">Get faster responses from our team</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3 h-3 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-neutral-900">Early Access</h4>
                <p className="text-sm text-neutral-600">Be first to try new platform features</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3 h-3 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-neutral-900">Community Impact</h4>
                <p className="text-sm text-neutral-600">Support democratic community building</p>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* No Subscription */}
          <div className="text-center p-8 bg-neutral-50 rounded-2xl">
            <div className="w-16 h-16 bg-neutral-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h3 className="font-semibold text-neutral-900 mb-2">No Active Membership</h3>
            <p className="text-neutral-600 mb-6">
              Upgrade to a monthly membership to submit project proposals and access exclusive features.
            </p>
            <Button 
              href="/membership"
            >
              Become a Member
            </Button>
          </div>

          {/* Free Member Benefits */}
          <div>
            <h4 className="font-medium text-neutral-900 mb-3">What you can do as a free member:</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-neutral-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-neutral-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-sm text-neutral-600">Vote on community projects</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-neutral-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-neutral-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-sm text-neutral-600">Make one-time donations</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-neutral-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-neutral-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-sm text-neutral-600">Watch project progress</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}