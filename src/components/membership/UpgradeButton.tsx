'use client'

import { useState } from 'react'

interface UpgradeButtonProps {
  className?: string
}

export function UpgradeButton({ className }: UpgradeButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleUpgrade = async () => {
    try {
      setIsLoading(true)
      
      // Create checkout session for $10/month membership
      const qs = new URLSearchParams()
      qs.set('frequency', 'monthly')
      qs.set('amount', '10') // $10/month
      qs.set('campaign', 'membership_upgrade')
      
      const res = await fetch(`/api/checkout/donate?${qs.toString()}`, { cache: 'no-store' })
      const data = await res.json()
      
      if (data.url) {
        window.location.href = data.url
      } else {
        alert(data.error || 'Failed to start checkout')
      }
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Failed to start checkout. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button 
      onClick={handleUpgrade}
      disabled={isLoading}
      className={className || "w-full bg-emerald-600 text-white rounded-2xl px-6 py-3 font-semibold hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"}
    >
      {isLoading ? 'Starting checkout...' : 'Upgrade to Monthly'}
    </button>
  )
}