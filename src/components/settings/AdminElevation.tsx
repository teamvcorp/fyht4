'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

interface AdminElevationProps {
  currentRole: string
}

export function AdminElevation({ currentRole }: AdminElevationProps) {
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false)
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const { update } = useSession()

  const handleElevateToAdmin = async () => {
    if (!password.trim()) {
      setError('Password is required')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/admin/elevate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      })

      const data = await response.json()

      if (response.ok) {
        alert('Admin role granted successfully! Refreshing page...')
        
        // Simple page reload - the auth config will now refresh the role immediately
        window.location.reload()
      } else {
        setError(data.error || 'Invalid password')
      }
    } catch (error) {
      setError('Failed to process request')
    } finally {
      setLoading(false)
      setPassword('')
    }
  }

  const handleCancel = () => {
    setShowPasswordPrompt(false)
    setPassword('')
    setError('')
  }

  if (currentRole === 'admin') {
    return (
      <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h3 className="font-display text-lg font-semibold text-neutral-900 mb-3">
          Admin Access
        </h3>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-sm font-medium text-blue-600">
              Administrator Role Active
            </span>
          </div>
          <p className="text-sm text-neutral-600">
            You have admin privileges and can manage projects, users, and system settings.
          </p>
          <a
            href="/admin"
            className="inline-flex items-center rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
          >
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Admin Dashboard
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
      <h3 className="font-display text-lg font-semibold text-neutral-900 mb-3">
        Role Management
      </h3>
      
      {!showPasswordPrompt ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-600">Current Role</span>
            <span className="text-sm font-medium text-neutral-900 capitalize">
              {currentRole}
            </span>
          </div>
          
          <div className="pt-3 border-t border-neutral-200">
            <p className="text-sm text-neutral-600 mb-3">
              Need administrative access? Contact your system administrator or use the admin elevation feature.
            </p>
            <button
              onClick={() => setShowPasswordPrompt(true)}
              className="inline-flex items-center rounded-2xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 transition"
            >
              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Request Admin Access
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <svg className="h-5 w-5 text-amber-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <h4 className="text-sm font-medium text-amber-800">Admin Access Request</h4>
                <p className="text-sm text-amber-700 mt-1">
                  Enter the admin password to elevate your account to administrator role.
                </p>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="admin-password" className="block text-sm font-medium text-neutral-700 mb-2">
              Admin Password
            </label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleElevateToAdmin()}
              placeholder="Enter admin password"
              className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              disabled={loading}
            />
            {error && (
              <p className="text-sm text-red-600 mt-1">{error}</p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleElevateToAdmin}
              disabled={loading || !password.trim()}
              className="flex-1 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Verifying...' : 'Grant Admin Access'}
            </button>
            <button
              onClick={handleCancel}
              disabled={loading}
              className="flex-1 rounded-xl border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:border-neutral-500 disabled:opacity-50 transition"
            >
              Cancel
            </button>
          </div>

          <p className="text-xs text-neutral-500">
            Admin access grants full system privileges including project management, user administration, and system configuration.
          </p>
        </div>
      )}
    </div>
  )
}