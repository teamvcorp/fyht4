'use client'

import { useState } from 'react'
import { Container } from '@/components/Container'
import { FadeIn } from '@/components/FadeIn'

type Frequency = 'once' | 'monthly'

export default function DonationTiers() {
  const [loadingKey, setLoadingKey] = useState<string | null>(null)

  async function startCheckout(amount: number | null, frequency: Frequency) {
    try {
      const key = `${frequency}-${amount ?? 'custom'}`
      setLoadingKey(key)
      const qs = new URLSearchParams()
      qs.set('frequency', frequency)
      if (amount != null) qs.set('amount', String(amount))
      const res = await fetch(`/api/checkout/donate?${qs.toString()}`, { cache: 'no-store' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else alert(data.error || 'Failed to start checkout')
    } catch (e) {
      console.error(e)
      alert('Checkout failed')
    } finally {
      setLoadingKey(null)
    }
  }

  const monthly = [
    { label: 'Supporter', amount: 25, blurb: 'Feeds a family for a week' },
    { label: 'Changemaker', amount: 50, blurb: 'Funds a week of housing stability' },
    { label: 'Champion', amount: 100, blurb: 'Trains 1–2 students in tech skills' },
    { label: 'Community Builder', amount: 250, blurb: 'Backs a neighborhood initiative' },
  ]
  const once = [
    { amount: 50, blurb: 'Groceries for a family' },
    { amount: 100, blurb: 'One month of utilities' },
    { amount: 500, blurb: 'Hardware for a coding cohort' },
    { amount: 1000, blurb: 'Jump-starts a micro-project' },
  ]

  return (
    <Container className="mt-16 sm:mt-24">
      <FadeIn>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Monthly (all original text/styling preserved) */}
          <div className="rounded-3xl border border-neutral-200 p-6 sm:p-8 shadow-sm bg-white">
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-neutral-900">
              Monthly Plans
            </h2>
            <p className="mt-2 text-neutral-600">
              Join our Circle of Change—steady monthly support powers steady outcomes.
            </p>
            <ul className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {monthly.map((t) => {
                const key = `monthly-${t.amount}`
                return (
                  <li key={t.label} className="rounded-2xl border border-neutral-200 p-4">
                    <div className="flex items-baseline justify-between">
                      <p className="text-lg font-semibold text-neutral-900">{t.label}</p>
                      <p className="text-lg font-bold text-neutral-900">
                        ${t.amount}
                        <span className="text-sm font-normal text-neutral-500">/mo</span>
                      </p>
                    </div>
                    <p className="mt-1 text-sm text-neutral-600">{t.blurb}</p>

                    {/* CHANGED: <a href=...> → <button onClick=...> (same visual classes) */}
                    <button
                      onClick={() => startCheckout(t.amount, 'monthly')}
                      disabled={loadingKey === key}
                      className="mt-4 inline-block rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800 transition disabled:opacity-50"
                    >
                      {loadingKey === key ? 'Loading…' : `Give $${t.amount}/mo`}
                    </button>
                  </li>
                )
              })}
            </ul>
            <div className="mt-4 text-sm">
              {/* CHANGED: <a> → <button> with prompt for custom amount (keeps same look) */}
              <button
                onClick={async () => {
                  const val = window.prompt('Enter a custom monthly amount (USD):', '25')
                  if (val == null) return
                  const amt = Number(val)
                  if (!Number.isFinite(amt) || amt < 1) {
                    alert('Please enter a valid amount (minimum $1).')
                    return
                  }
                  await startCheckout(amt, 'monthly')
                }}
                className="underline text-neutral-700 hover:text-neutral-900"
              >
                Enter a custom monthly amount →
              </button>
            </div>
          </div>

          {/* One-time (all original text/styling preserved) */}
          <div className="rounded-3xl border border-neutral-200 p-6 sm:p-8 shadow-sm bg-white">
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-neutral-900">
              One-time Gifts
            </h2>
            <p className="mt-2 text-neutral-600">
              Make an immediate impact with a single contribution.
            </p>
            <ul className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {once.map((t) => {
                const key = `once-${t.amount}`
                return (
                  <li key={t.amount} className="rounded-2xl border border-neutral-200 p-4">
                    <p className="text-lg font-bold text-neutral-900">${t.amount}</p>
                    <p className="mt-1 text-sm text-neutral-600">{t.blurb}</p>

                    {/* CHANGED: <a href=...> → <button onClick=...> */}
                    <button
                      onClick={() => startCheckout(t.amount, 'once')}
                      disabled={loadingKey === key}
                      className="mt-4 inline-block rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition disabled:opacity-50"
                    >
                      {loadingKey === key ? 'Loading…' : `Donate $${t.amount}`}
                    </button>
                  </li>
                )
              })}
            </ul>
            <div className="mt-4 text-sm">
              <button
                onClick={async () => {
                  const val = window.prompt('Enter a custom one-time amount (USD):', '50')
                  if (val == null) return
                  const amt = Number(val)
                  if (!Number.isFinite(amt) || amt < 1) {
                    alert('Please enter a valid amount (minimum $1).')
                    return
                  }
                  await startCheckout(amt, 'once')
                }}
                className="underline text-neutral-700 hover:text-neutral-900"
              >
                Enter a custom amount →
              </button>
            </div>
          </div>
        </div>
      </FadeIn>
    </Container>
  )
}
