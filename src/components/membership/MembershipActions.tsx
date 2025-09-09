'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'

export default function MembershipActions() {
  const [email, setEmail] = useState('')
  const [newsletter, setNewsletter] = useState(true)
  const [loading, setLoading] = useState<'google' | 'email' | null>(null)

  const callbackUrl = '/membership/welcome' // change to your dashboard if you like

  async function handleGoogle() {
    try {
      setLoading('google')
      // optional: pre-subscribe email if present and newsletter checked
      if (newsletter && email && validateEmail(email)) {
        await subscribeNewsletter(email)
      }
      await signIn('google', { callbackUrl })
    } finally {
      setLoading(null)
    }
  }

  async function handleEmail() {
    try {
      if (!validateEmail(email)) {
        alert('Please enter a valid email.')
        return
      }
      setLoading('email')

      // Newsletter opt-in before sign-in (best-effort)
      if (newsletter) {
        await subscribeNewsletter(email)
      }

      // Triggers NextAuth Email provider (Resend will send the magic link)
      await signIn('email', { email, callbackUrl })
      alert('Check your email for a secure sign-in link.')
    } finally {
      setLoading(null)
    }
  }

  async function subscribeNewsletter(addr: string) {
    const res = await fetch('/api/newsletter/subscribe', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: addr }),
    })
    // non-blocking: ignore non-2xx
    return res.ok
  }

  function validateEmail(v: string) {
    return /\S+@\S+\.\S+/.test(v)
  }

  return (
    <div className="mt-8 mx-auto max-w-xl">
      {/* Google sign-in */}
      <button
        onClick={handleGoogle}
        disabled={loading === 'google'}
        className="w-full rounded-2xl bg-neutral-900 px-6 py-3 text-white text-lg font-semibold hover:bg-neutral-800 transition disabled:opacity-50"
      >
        {loading === 'google' ? 'Connecting to Google…' : 'Continue with Google'}
      </button>

      {/* Divider */}
      <div className="my-6 flex items-center justify-center gap-3 text-neutral-500">
        <span className="h-px w-16 bg-neutral-200" />
        <span className="text-sm">or</span>
        <span className="h-px w-16 bg-neutral-200" />
      </div>

      {/* Email sign-in */}
      <label htmlFor="email" className="block text-sm font-medium text-neutral-800">
        Email address
      </label>
      <div className="mt-1 flex gap-2">
        <input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-neutral-500"
          placeholder="you@example.com"
        />
        <button
          onClick={handleEmail}
          disabled={loading === 'email'}
          className="rounded-2xl bg-emerald-600 px-5 py-3 text-white font-semibold hover:bg-emerald-700 transition disabled:opacity-50"
        >
          {loading === 'email' ? 'Sending link…' : 'Email me a link'}
        </button>
      </div>

      {/* Newsletter opt-in */}
      <label className="mt-4 flex items-start gap-3 text-sm text-neutral-700">
        <input
          type="checkbox"
          checked={newsletter}
          onChange={(e) => setNewsletter(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-neutral-300"
        />
        Subscribe me to FYHT4 updates and impact briefs
      </label>

      {/* Fine print */}
      <p className="mt-4 text-xs text-neutral-500">
        By continuing, you agree to our Terms and acknowledge our Privacy Policy.
      </p>
    </div>
  )
}
