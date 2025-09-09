'use client'

import { useState } from 'react'

export default function DonateCtas() {
    const [loading, setLoading] = useState(false)

    async function startCheckout(amount: number | null, frequency: 'once' | 'monthly') {
        try {
            setLoading(true)
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
            setLoading(false)
        }
    }

    return (
        <div className="mt-8 sm:mt-12">
            <div className="mx-auto max-w-3xl text-center">
                <h1 className="font-display text-4xl sm:text-6xl font-bold tracking-tight text-neutral-950">
                    Fuel Direct Action—Donate or Become a Member
                </h1>
                <p className="mt-6 text-xl text-neutral-600 leading-relaxed">
                    Your support turns community votes into funded projects in{' '}
                    <span className="font-semibold text-neutral-900">education</span>,{' '}
                    <span className="font-semibold text-neutral-900">health & well-being</span>, and{' '}
                    <span className="font-semibold text-neutral-900">housing</span>.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
                    {/* CHANGED: <a href=...> → <button onClick={...}> (same styling) */}
                    <button
                        onClick={async () => {
                            const val = window.prompt('Enter a one-time amount (USD):', '50')
                            if (!val) return
                            const amt = Number(val)
                            if (!Number.isFinite(amt) || amt < 1) return alert('Please enter at least $1.')
                            await startCheckout(amt, 'once')
                        }}
                        disabled={loading}
                        className="rounded-2xl bg-emerald-600 px-6 py-3 text-lg font-semibold text-white shadow-lg hover:bg-emerald-700 transition disabled:opacity-50"
                    >
                        {loading ? 'Loading…' : 'Donate Now'}
                    </button>


                    {/* Membership remains a normal link (not a checkout) */}
                    <a
                        href="/membership"
                        className="rounded-2xl border border-neutral-300 px-6 py-3 text-lg font-semibold text-neutral-800 hover:border-neutral-500 transition"
                    >
                        Become a Member
                    </a>
                </div>
                <p className="mt-4 text-sm text-neutral-500">
                    Prefer monthly support? Choose a plan below or switch to monthly at checkout.
                </p>
            </div>
        </div>
    )
}
