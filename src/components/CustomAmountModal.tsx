// components/CustomAmountModal.tsx
'use client'

import { useEffect, useRef, useState } from 'react'

type Frequency = 'once' | 'monthly'

export default function CustomAmountModal({
  open,
  onClose,
  defaultFrequency = 'once',
  onStartCheckout,
}: {
  open: boolean
  onClose: () => void
  defaultFrequency?: Frequency
  onStartCheckout: (amount: number, frequency: Frequency) => Promise<void>
}) {
  const [amount, setAmount] = useState<string>('')
  const [frequency, setFrequency] = useState<Frequency>(defaultFrequency)
  const [error, setError] = useState<string>('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setAmount('')
      setFrequency(defaultFrequency)
      setError('')
      // focus the input when opened
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [open, defaultFrequency])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!open) return
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  async function submit() {
    setError('')
    const value = Number(amount)
    if (!Number.isFinite(value) || value < 1) {
      setError('Please enter a valid amount of at least $1.')
      return
    }
    await onStartCheckout(Math.round(value * 100) / 100, frequency) // keep pennies if typed
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
      aria-labelledby="custom-amount-title"
      onClick={(e) => {
        // close when clicking the backdrop
        if (e.target === e.currentTarget) onClose()
      }}
    >
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/50" />

      {/* dialog */}
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-lg">
        <h2 id="custom-amount-title" className="font-display text-2xl font-semibold text-neutral-900">
          Enter a custom amount
        </h2>
        <p className="mt-2 text-sm text-neutral-600">
          Choose your gift and frequency. You’ll be redirected to our secure Stripe checkout.
        </p>

        <div className="mt-4">
          <label className="block text-sm font-medium text-neutral-800" htmlFor="donation-amount">
            Amount (USD)
          </label>
          <div className="mt-1 flex items-center gap-2">
            <span className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-neutral-600">$</span>
            <input
              id="donation-amount"
              ref={inputRef}
              inputMode="decimal"
              pattern="[0-9]*"
              className="w-full rounded-xl border border-neutral-300 px-4 py-2 text-neutral-900 outline-none focus:border-neutral-500"
              placeholder="50"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))}
            />
          </div>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>

        <fieldset className="mt-4">
          <legend className="text-sm font-medium text-neutral-800">Frequency</legend>
          <div className="mt-2 flex gap-3">
            <button
              type="button"
              onClick={() => setFrequency('once')}
              className={`rounded-xl border px-4 py-2 text-sm ${
                frequency === 'once'
                  ? 'border-neutral-900 bg-neutral-900 text-white'
                  : 'border-neutral-300 text-neutral-800 hover:border-neutral-500'
              }`}
            >
              One-time
            </button>
            <button
              type="button"
              onClick={() => setFrequency('monthly')}
              className={`rounded-xl border px-4 py-2 text-sm ${
                frequency === 'monthly'
                  ? 'border-neutral-900 bg-neutral-900 text-white'
                  : 'border-neutral-300 text-neutral-800 hover:border-neutral-500'
              }`}
            >
              Monthly
            </button>
          </div>
        </fieldset>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-800 hover:border-neutral-500"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Continue to Checkout
          </button>
        </div>
      </div>
    </div>
  )
}
