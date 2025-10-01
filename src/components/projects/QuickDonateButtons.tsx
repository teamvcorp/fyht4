'use client'

import { useState } from 'react'
import { useWallet } from '@/hooks/useWallet'

interface QuickDonateButtonsProps {
  projectId: string
  projectTitle: string
  projectStatus?: string // Add project status
  amounts?: number[] // default [5, 10, 25]
  showWalletOption?: boolean // default true
}

export function QuickDonateButtons({ 
  projectId, 
  projectTitle, 
  projectStatus = 'voting',
  amounts = [5, 10, 25],
  showWalletOption = true 
}: QuickDonateButtonsProps) {
  const { wallet, quickDonate, addFunds, isAuthenticated } = useWallet()
  const [loading, setLoading] = useState<number | null>(null)
  const [useWalletPayment, setUseWalletPayment] = useState(true)
  const [showAddFunds, setShowAddFunds] = useState(false)
  const [pendingDonation, setPendingDonation] = useState<{ amount: number } | null>(null)

  // Check if project accepts donations (voting or funding status)
  const acceptsDonations = ['voting', 'funding'].includes(projectStatus)
  
  // Get status-specific messaging
  const getStatusMessage = () => {
    switch (projectStatus) {
      case 'voting':
        return 'Vote and donate to support this project'
      case 'funding':
        return 'Help fund this approved project'
      case 'build':
        return 'This project is currently being built'
      case 'completed':
        return 'This project has been completed'
      case 'archived':
        return 'This project has been archived'
      default:
        return 'This project is not currently accepting donations'
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="space-y-2">
        {acceptsDonations ? (
          <div className="flex gap-2">
            {amounts.map(amount => (
              <a
                key={amount}
                href="/membership"
                className="rounded-xl bg-neutral-900 px-3 py-2 text-xs font-semibold text-white hover:bg-neutral-800 transition"
              >
                Donate ${amount}
              </a>
            ))}
          </div>
        ) : (
          <div className="text-sm text-neutral-600">
            {getStatusMessage()}
          </div>
        )}
      </div>
    )
  }

  // If project doesn't accept donations, show status message
  if (!acceptsDonations) {
    return (
      <div className="space-y-2">
        <div className="text-sm text-neutral-600">
          {getStatusMessage()}
        </div>
        {projectStatus === 'build' && (
          <p className="text-xs text-neutral-500">
            Check back for updates on the project's progress.
          </p>
        )}
        {projectStatus === 'completed' && (
          <p className="text-xs text-neutral-500">
            Thank you for your support in making this project a reality!
          </p>
        )}
      </div>
    )
  }

  const handleWalletDonate = async (amount: number) => {
    setLoading(amount)
    try {
      await quickDonate(projectId, amount)
      // Success feedback could be shown here
      alert(`Successfully donated $${amount} to "${projectTitle}"!`)
    } catch (error: any) {
      if (error.message.includes('Insufficient wallet balance')) {
        // Check if auto-refill is available
        try {
          const response = await fetch('/api/wallet/quick-donate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ projectId, amount })
          })
          
          if (!response.ok) {
            const errorData = await response.json()
            if (errorData.canAutoRefill) {
              // Offer auto-refill option
              if (confirm(`Insufficient funds. Auto-refill $${(errorData.autoRefillAmount / 100).toFixed(2)} and complete donation?`)) {
                try {
                  const refillResponse = await fetch('/api/wallet/trigger-auto-refill', {
                    method: 'POST'
                  })
                  
                  if (refillResponse.ok) {
                    // Retry the donation
                    await quickDonate(projectId, amount)
                    alert(`Successfully donated $${amount} to "${projectTitle}"!`)
                  } else {
                    const refillError = await refillResponse.json()
                    alert(`Auto-refill failed: ${refillError.error}`)
                  }
                } catch (refillError) {
                  alert('Auto-refill failed. Please add funds manually.')
                }
              }
            } else {
              // Regular insufficient funds flow
              setPendingDonation({ amount })
              setShowAddFunds(true)
            }
          }
        } catch {
          // Fallback to regular insufficient funds flow
          setPendingDonation({ amount })
          setShowAddFunds(true)
        }
      } else {
        alert(error.message || 'Donation failed')
      }
    } finally {
      setLoading(null)
    }
  }

  const handleDirectDonate = async (amount: number) => {
    setLoading(amount)
    try {
      // Use existing direct Stripe checkout
      const qs = new URLSearchParams()
      qs.set('frequency', 'once')
      qs.set('amount', String(amount))
      qs.set('campaign', projectId)

      const res = await fetch(`/api/checkout/donate?${qs.toString()}`, { cache: 'no-store' })
      const data = await res.json()
      
      if (data?.url) {
        window.location.href = data.url
      } else {
        throw new Error(data?.error || 'Failed to start checkout')
      }
    } catch (error: any) {
      alert(error.message || 'Checkout failed')
    } finally {
      setLoading(null)
    }
  }

  const handleAddFunds = async (fundAmount: number) => {
    try {
      const data = await addFunds(fundAmount, false, window.location.pathname)
      if (data.url) {
        // Store pending donation for after wallet refill
        if (pendingDonation) {
          localStorage.setItem('pendingDonation', JSON.stringify({
            projectId,
            amount: pendingDonation.amount,
            projectTitle
          }))
        }
        window.location.href = data.url
      }
    } catch (error: any) {
      alert(error.message || 'Failed to add funds')
    }
  }

  const handleDonate = async (amount: number) => {
    if (useWalletPayment) {
      await handleWalletDonate(amount)
    } else {
      await handleDirectDonate(amount)
    }
  }

  const walletBalance = wallet?.balance || 0
  const isLowBalance = wallet?.isLowBalance || false

  return (
    <div className="space-y-3">
      {/* Payment method selection */}
      {showWalletOption && (
        <div className="flex items-center gap-3 text-sm">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={useWalletPayment}
              onChange={(e) => setUseWalletPayment(e.target.checked)}
              className="rounded border-neutral-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-neutral-700">
              Use wallet for faster donations {wallet && `($${wallet.balanceDollars} available)`}
            </span>
          </label>
          {isLowBalance && wallet && (
            <button
              onClick={() => setShowAddFunds(true)}
              className="text-xs text-emerald-600 hover:text-emerald-700 underline"
              title={`Balance below $${(wallet.threshold / 100).toFixed(2)} - consider topping up`}
            >
              Top up wallet
            </button>
          )}
        </div>
      )}

      {/* Quick donate buttons */}
      <div className="flex gap-2">
        {amounts.map(amount => {
          const canAfford = walletBalance >= amount * 100
          const isLoading = loading === amount
          
          return (
            <button
              key={amount}
              onClick={() => handleDonate(amount)}
              disabled={isLoading || (useWalletPayment && !canAfford && !showAddFunds)}
              className={`rounded-xl px-3 py-2 text-xs font-semibold transition disabled:opacity-50 ${
                useWalletPayment && !canAfford
                  ? 'bg-orange-100 text-orange-700 border border-orange-300 hover:bg-orange-200'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
              }`}
              title={
                useWalletPayment && !canAfford 
                  ? `Need $${((amount * 100 - walletBalance) / 100).toFixed(2)} more in wallet`
                  : `Donate $${amount} to ${projectTitle}`
              }
            >
              {isLoading ? 'Processing...' : `$${amount}`}
              {useWalletPayment && !canAfford && ' (Add funds)'}
            </button>
          )
        })}
      </div>

      {/* Status message and project info */}
      <div className="text-xs text-neutral-600 space-y-1">
        <p>{getStatusMessage()}</p>
        <p className="text-neutral-500">
          💡 Projects that don't reach community support will have funds redirected to other approved projects in the same ZIP code.
        </p>
      </div>

      {/* Add funds modal */}
      {showAddFunds && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">
              Add Funds to Wallet
            </h3>
            
            {pendingDonation && (
              <p className="text-sm text-neutral-600 mb-4">
                You need ${((pendingDonation.amount * 100 - walletBalance) / 100).toFixed(2)} more to donate ${pendingDonation.amount} to "{projectTitle}".
              </p>
            )}

            <div className="grid grid-cols-2 gap-3 mb-4">
              {[25, 50, 100, 200].map(amount => (
                <button
                  key={amount}
                  onClick={() => handleAddFunds(amount)}
                  className="rounded-xl border border-neutral-300 px-4 py-3 text-sm font-medium text-neutral-900 hover:border-neutral-500 transition"
                >
                  Add ${amount}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowAddFunds(false)
                  setPendingDonation(null)
                }}
                className="flex-1 rounded-xl border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:border-neutral-500 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const amount = prompt('Enter custom amount (minimum $25):')
                  if (amount) {
                    const num = parseFloat(amount)
                    if (num >= 25) {
                      handleAddFunds(num)
                    } else {
                      alert('Minimum amount is $25')
                    }
                  }
                }}
                className="flex-1 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition"
              >
                Custom Amount
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}