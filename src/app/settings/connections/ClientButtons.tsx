'use client'

import { signIn, signOut } from 'next-auth/react'

export function ConnectGoogleButton() {
  return (
    <button
      onClick={() => signIn('google', { callbackUrl: '/settings/connections' })}
      className="rounded-2xl bg-neutral-900 px-5 py-3 text-white font-semibold hover:bg-neutral-800 transition"
    >
      Connect Google
    </button>
  )
}

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/' })}
      className="rounded-2xl border border-neutral-300 px-5 py-3 font-semibold text-neutral-800 hover:border-neutral-500 transition"
    >
      Sign out
    </button>
  )
}
