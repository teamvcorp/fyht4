// components/projects/ProjectDonatePanel.tsx
'use client'

import { useState } from 'react'

type Frequency = 'once' | 'monthly'

export default function ProjectDonatePanel({
  projectId,
  projectTitle,
}: {
  projectId: string
  projectTitle: string
}) {
  const [loadingKey, setLoadingKey] = useState<string | null>(null)

  async function startCheckout(amount: number | null, frequency: Frequency) {
    const key = `${frequency}-${amount ?? 'custom'}`
    try {
      setLoadingKey(key)
      const qs = new URLSearchParams()
      qs.set('frequency', frequency)
      if (amount != null) qs.set('amount', String(amount))
      qs.set('campaign', projectId) // <-- attribute to this project
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
    { label: 'Supporter', amount: 10, blurb: 'Sustains monthly progress' },
    { label: 'Builder', amount: 25, blurb: 'Funds local materials' },
    { label: 'Backer', amount: 50, blurb: 'Accelerates delivery' },
    { label: 'Champion', amount: 100, blurb: 'Underwrites key milestones' },
  ]
  const once = [
    { amount: 25, blurb: 'Kickstarts a task' },
    { amount: 50, blurb: 'Buys supplies' },
    { amount: 100, blurb: 'Moves a milestone' },
    { amount: 250, blurb: 'Backs a major step' },
  ]

  return (
    <div className="rounded-3xl border border-neutral-200 bg-white p-6 sm:p-8 shadow-sm">
      <h2 className="font-display text-2xl sm:text-3xl font-semibold text-neutral-900">
        Donate to “{projectTitle}”
      </h2>
      <p className="mt-2 text-neutral-600">
        Your gift goes directly toward this project. Choose monthly or one-time support.
      </p>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly */}
        <div className="rounded-2xl border border-neutral-200 p-4">
          <h3 className="font-semibold text-neutral-900">Monthly</h3>
          <ul className="mt-4 grid grid-cols-2 gap-3">
            {monthly.map(t => {
              const key = `monthly-${t.amount}`
              return (
                <li key={t.label} className="rounded-xl border border-neutral-200 p-3">
                  <p className="text-sm font-medium text-neutral-900">{t.label}</p>
                  <p className="text-sm text-neutral-700">${t.amount}/mo — {t.blurb}</p>
                  <button
                    onClick={() => startCheckout(t.amount, 'monthly')}
                    disabled={loadingKey === key}
                    className="mt-3 inline-block w-full rounded-xl bg-neutral-900 px-3 py-2 text-sm font-semibold text-white hover:bg-neutral-800 transition disabled:opacity-50"
                  >
                    {loadingKey === key ? 'Loading…' : `Give $${t.amount}/mo`}
                  </button>
                </li>
              )
            })}
          </ul>
          <div className="mt-3 text-sm">
            <button
              onClick={async () => {
                const val = window.prompt('Custom monthly amount (USD):', '20')
                if (val == null) return
                const amt = Number(val)
                if (!Number.isFinite(amt) || amt < 1) return alert('Please enter at least $1.')
                await startCheckout(amt, 'monthly')
              }}
              className="underline text-neutral-700 hover:text-neutral-900"
            >
              Enter a custom monthly amount →
            </button>
          </div>
        </div>

        {/* One-time */}
        <div className="rounded-2xl border border-neutral-200 p-4">
          <h3 className="font-semibold text-neutral-900">One-time</h3>
          <ul className="mt-4 grid grid-cols-2 gap-3">
            {once.map(t => {
              const key = `once-${t.amount}`
              return (
                <li key={t.amount} className="rounded-xl border border-neutral-200 p-3">
                  <p className="text-sm font-medium text-neutral-900">${t.amount}</p>
                  <p className="text-sm text-neutral-700">{t.blurb}</p>
                  <button
                    onClick={() => startCheckout(t.amount, 'once')}
                    disabled={loadingKey === key}
                    className="mt-3 inline-block w-full rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition disabled:opacity-50"
                  >
                    {loadingKey === key ? 'Loading…' : `Donate $${t.amount}`}
                  </button>
                </li>
              )
            })}
          </ul>
          <div className="mt-3 text-sm">
            <button
              onClick={async () => {
                const val = window.prompt('Custom one-time amount (USD):', '50')
                if (val == null) return
                const amt = Number(val)
                if (!Number.isFinite(amt) || amt < 1) return alert('Please enter at least $1.')
                await startCheckout(amt, 'once')
              }}
              className="underline text-neutral-700 hover:text-neutral-900"
            >
              Enter a custom amount →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
