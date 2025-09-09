// components/projects/DonateNowButton.tsx
'use client'

import { useState } from 'react'

export default function DonateNowButton({
  projectId,
  projectTitle,
  amount = 25,
  frequency = 'once',
}: {
  projectId: string
  projectTitle: string
  amount?: number
  frequency?: 'once' | 'monthly'
}) {
  const [loading, setLoading] = useState(false)

  async function start() {
    try {
      setLoading(true)
      const qs = new URLSearchParams()
      qs.set('frequency', frequency)
      qs.set('amount', String(amount))
      // campaign = tie money to this project in the webhook
      qs.set('campaign', projectId)

      const res = await fetch(`/api/checkout/donate?${qs.toString()}`, { cache: 'no-store' })
      const data = await res.json()
      if (data?.url) {
        window.location.href = data.url
      } else {
        alert(data?.error || 'Failed to start checkout')
      }
    } catch (e: any) {
      console.error(e)
      alert('Checkout failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={start}
      disabled={loading}
      title={`Donate to ${projectTitle}`}
      className="rounded-xl bg-neutral-900 px-3 py-2 text-xs font-semibold text-white hover:bg-neutral-800 transition disabled:opacity-50"
    >
      {loading ? 'Starting…' : `Donate $${amount}`}
    </button>
  )
}
