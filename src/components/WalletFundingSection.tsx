'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useWallet } from '@/hooks/useWallet'
import { Container } from '@/components/Container'
import { FadeIn } from '@/components/FadeIn'

export function WalletFundingSection() {
  const { data: session } = useSession()
  const { wallet, addFunds } = useWallet()
  const [loading, setLoading] = useState<number | null>(null)

  if (!session?.user?.id) {
    return (
      <Container className="mt-24 sm:mt-32">
        <FadeIn>
          <div className="rounded-3xl bg-gradient-to-r from-emerald-50 to-emerald-100 border border-emerald-200 p-8 sm:p-12 text-center">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">
              💰 Support Any Project, Instantly
            </h2>
            <p className="text-lg text-neutral-700 mb-6 max-w-2xl mx-auto">
              Add funds to your wallet and donate to any community project with one click. 
              Your contributions help bring vital housing, education, and health projects to life.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a
                href="/membership"
                className="rounded-2xl bg-emerald-600 px-8 py-3 text-lg font-semibold text-white hover:bg-emerald-700 transition"
              >
                Join to Add Funds
              </a>
              <p className="text-sm text-neutral-600">
                Minimum $25 • Unused funds support projects in your ZIP code
              </p>
            </div>
          </div>
        </FadeIn>
      </Container>
    )
  }

  const handleAddFunds = async (amount: number) => {
    setLoading(amount)
    try {
      const data = await addFunds(amount, false, '/')
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error: any) {
      alert(error.message || 'Failed to add funds')
    } finally {
      setLoading(null)
    }
  }

  return (
    <Container className="mt-24 sm:mt-32">
      <FadeIn>
        <div className="rounded-3xl bg-gradient-to-r from-emerald-50 to-emerald-100 border border-emerald-200 p-8 sm:p-12">
          <div className="text-center mb-8">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">
              💰 Fund Your Impact Wallet
            </h2>
            <p className="text-lg text-neutral-700 mb-2 max-w-2xl mx-auto">
              Add funds for instant donations to any community project. Support housing, education, and health initiatives with one click.
            </p>
            {wallet && (
              <p className="text-sm text-emerald-700 font-medium">
                Current balance: ${wallet.balanceDollars}
              </p>
            )}
          </div>

          {/* Quick add amounts */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto mb-6">
            {[25, 50, 100, 200].map(amount => (
              <button
                key={amount}
                onClick={() => handleAddFunds(amount)}
                disabled={loading === amount}
                className="rounded-xl border-2 border-emerald-300 bg-white px-4 py-4 text-center hover:border-emerald-500 hover:bg-emerald-50 transition disabled:opacity-50"
              >
                <div className="font-bold text-xl text-neutral-900">${amount}</div>
                <div className="text-xs text-neutral-600">Add to wallet</div>
                {loading === amount && (
                  <div className="text-xs text-emerald-600 mt-1">Processing...</div>
                )}
              </button>
            ))}
          </div>

          {/* Custom amount */}
          <div className="text-center">
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
              className="text-emerald-700 hover:text-emerald-800 font-medium underline"
            >
              Add a custom amount →
            </button>
          </div>

          {/* Benefits and info */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            <div className="bg-white/70 rounded-xl p-4">
              <div className="text-2xl mb-2">⚡</div>
              <div className="font-semibold text-neutral-900">One-Click Donations</div>
              <div className="text-sm text-neutral-600">Skip checkout, donate instantly to any project</div>
            </div>
            <div className="bg-white/70 rounded-xl p-4">
              <div className="text-2xl mb-2">🎯</div>
              <div className="font-semibold text-neutral-900">Smart Allocation</div>
              <div className="text-sm text-neutral-600">Unused funds go to approved projects in your ZIP</div>
            </div>
            <div className="bg-white/70 rounded-xl p-4">
              <div className="text-2xl mb-2">🔐</div>
              <div className="font-semibold text-neutral-900">Secure & Transparent</div>
              <div className="text-sm text-neutral-600">Track every dollar with full transaction history</div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-neutral-500">
              💡 <strong>Fair Use Policy:</strong> Projects that don't receive enough community support will have their funds 
              automatically redirected to other approved projects in the same ZIP code, maximizing your local impact.
            </p>
          </div>
        </div>
      </FadeIn>
    </Container>
  )
}