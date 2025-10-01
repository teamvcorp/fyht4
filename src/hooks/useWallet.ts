// hooks/useWallet.ts
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'

interface WalletBalance {
  balance: number
  balanceDollars: string
  isLowBalance: boolean
  threshold: number
  autoRefillEnabled: boolean
  autoRefillAmount: number
  suggestedTopUp: number | null
}

export function useWallet() {
  const { data: session } = useSession()
  const [wallet, setWallet] = useState<WalletBalance | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchBalance = useCallback(async () => {
    if (!session?.user?.id) {
      setWallet(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/wallet/balance', {
        cache: 'no-store'
      })

      if (!response.ok) {
        throw new Error('Failed to fetch wallet balance')
      }

      const data = await response.json()
      setWallet(data)
    } catch (err: any) {
      setError(err.message)
      setWallet(null)
    } finally {
      setLoading(false)
    }
  }, [session?.user?.id])

  useEffect(() => {
    fetchBalance()
  }, [fetchBalance])

  const quickDonate = async (projectId: string, amount: number) => {
    if (!session?.user?.id) {
      throw new Error('Authentication required')
    }

    const response = await fetch('/api/wallet/quick-donate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        projectId,
        amount
      })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Donation failed')
    }

    // Refresh balance after successful donation
    await fetchBalance()

    return data
  }

  const addFunds = async (amount: number, savePaymentMethod = false, returnUrl?: string) => {
    if (!session?.user?.id) {
      throw new Error('Authentication required')
    }

    const response = await fetch('/api/wallet/add-funds', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount,
        savePaymentMethod,
        returnUrl
      })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Failed to add funds')
    }

    return data
  }

  return {
    wallet,
    loading,
    error,
    fetchBalance,
    quickDonate,
    addFunds,
    isAuthenticated: !!session?.user?.id
  }
}