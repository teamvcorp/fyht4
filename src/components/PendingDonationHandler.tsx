'use client'

import { useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useWallet } from '@/hooks/useWallet'

function PendingDonationHandlerInner() {
  const searchParams = useSearchParams()
  const { quickDonate } = useWallet()
  const walletFunded = searchParams.get('wallet_funded')

  useEffect(() => {
    if (walletFunded === 'true') {
      // Check for pending donation
      const pendingStr = localStorage.getItem('pendingDonation')
      if (pendingStr) {
        try {
          const pending = JSON.parse(pendingStr)
          localStorage.removeItem('pendingDonation')
          
          // Show confirmation and auto-donate
          if (confirm(`Your wallet has been funded! Would you like to complete your $${pending.amount} donation to "${pending.projectTitle}"?`)) {
            quickDonate(pending.projectId, pending.amount)
              .then(() => {
                alert(`Successfully donated $${pending.amount} to "${pending.projectTitle}"!`)
              })
              .catch((error) => {
                alert(`Donation failed: ${error.message}`)
              })
          }
        } catch (error) {
          console.error('Error processing pending donation:', error)
        }
      }
    }
  }, [walletFunded, quickDonate])

  return null // This component doesn't render anything
}

export function PendingDonationHandler() {
  return (
    <Suspense fallback={null}>
      <PendingDonationHandlerInner />
    </Suspense>
  )
}