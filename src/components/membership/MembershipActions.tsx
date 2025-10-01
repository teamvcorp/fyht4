// src/app/membership/MembershipActions.tsx
'use client'

import { useState, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { signIn } from 'next-auth/react'

export default function MembershipActions() {
  const [email, setEmail] = useState('')
  const [newsletter, setNewsletter] = useState(true)
  const [loading, setLoading] = useState<'google' | 'email' | null>(null)
  const callbackUrl = '/membership/welcome'
  const searchParams = useSearchParams()
  const authError = searchParams.get('error')

  const niceError = useMemo(() => {
    if (authError === 'OAuthAccountNotLinked') {
      return {
        title: 'This email is already registered',
        body:
          'Sign in with your original method (e.g., Email link). Once signed in, open Settings → Connections to link Google.',
      }
    }
    return null
  }, [authError])

  async function subscribeNewsletter(addr: string) {
    const res = await fetch('/api/newsletter/subscribe', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: addr }),
    })
    return res.ok
  }
  const validateEmail = (v: string) => /\S+@\S+\.\S+/.test(v)

  async function handleGoogle() {
    try {
      setLoading('google')
      if (newsletter && email && validateEmail(email)) await subscribeNewsletter(email)
      await signIn('google', { callbackUrl })
    } finally { setLoading(null) }
  }

  async function handleEmail() {
    try {
      if (!validateEmail(email)) return alert('Please enter a valid email.')
      setLoading('email')
      if (newsletter) await subscribeNewsletter(email)
      await signIn('email', { email, callbackUrl })
      alert('Check your email for a secure sign-in link.')
    } finally { setLoading(null) }
  }

  return (
    <div className="mt-8 mx-auto max-w-xl">
      {niceError && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
          <p className="font-semibold">{niceError.title}</p>
          <p className="mt-1 text-sm">{niceError.body}</p>
          <div className="mt-2">
            <Link
              href="/settings"
              className="inline-block rounded-xl border border-amber-300 px-3 py-1.5 text-sm font-semibold hover:border-amber-400"
            >
              Go to Settings → Connections
            </Link>
          </div>
        </div>
      )}

      <button
        onClick={handleGoogle}
        disabled={loading === 'google'}
        className="w-full rounded-2xl bg-neutral-900 px-6 py-3 text-white text-lg font-semibold hover:bg-neutral-800 transition disabled:opacity-50"
      >
        {loading === 'google' ? 'Connecting to Google…' : 'Continue with Google'}
      </button>

      <div className="my-6 flex items-center justify-center gap-3 text-neutral-500">
        <span className="h-px w-16 bg-neutral-200" />
        <span className="text-sm">or</span>
        <span className="h-px w-16 bg-neutral-200" />
      </div>

      <label htmlFor="email" className="block text-sm font-medium text-neutral-800">
        Email address
      </label>
      <div className="mt-1 flex gap-2">
        <input
          id="email" type="email" autoComplete="email"
          value={email} onChange={(e) => setEmail(e.target.value)}
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

      <label className="mt-4 flex items-start gap-3 text-sm text-neutral-700">
        <input
          type="checkbox"
          checked={newsletter}
          onChange={(e) => setNewsletter(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-neutral-300"
        />
        Subscribe me to FYHT4 updates and impact briefs
      </label>

      <p className="mt-4 text-xs text-neutral-500">
        By continuing, you agree to our Terms and acknowledge our Privacy Policy.
      </p>

      {/* Always-visible helper for signed-in users */}
      <p className="mt-6 text-sm text-neutral-600">
        Already signed in?{' '}
        <Link href="/settings" className="underline hover:text-neutral-800">
          Manage your connected accounts
        </Link>
        .
      </p>
    </div>
  )
}
