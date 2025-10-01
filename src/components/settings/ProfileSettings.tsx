'use client'

import { useState } from 'react'
import { Button } from '@/components/Button'

interface ProfileSettingsProps {
  user: {
    _id: string
    name?: string | null
    email?: string | null
    zipcode?: string | null
    role: string
    createdAt?: Date | string
  }
}

export function ProfileSettings({ user }: ProfileSettingsProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: user.name || '',
    zipcode: user.zipcode || '',
  })
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/profile/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim() || null,
          zipcode: formData.zipcode.trim() || null,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update profile')
      }

      setMessage({ type: 'success', text: 'Profile updated successfully!' })
      setIsEditing(false)
      
      // Refresh the page after a short delay to show updated data
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      name: user.name || '',
      zipcode: user.zipcode || '',
    })
    setIsEditing(false)
    setMessage(null)
  }

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-4 rounded-2xl ${
          message.type === 'success' 
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {isEditing ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-neutral-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full rounded-2xl border border-neutral-300 px-4 py-2 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="Enter your full name"
            />
          </div>

          <div>
            <label htmlFor="zipcode" className="block text-sm font-medium text-neutral-700 mb-1">
              ZIP Code
            </label>
            <input
              type="text"
              id="zipcode"
              value={formData.zipcode}
              onChange={(e) => setFormData({ ...formData, zipcode: e.target.value })}
              className="w-full rounded-2xl border border-neutral-300 px-4 py-2 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="12345"
              maxLength={10}
            />
            <p className="text-sm text-neutral-500 mt-1">
              Used to show you local projects and voting opportunities
            </p>
          </div>

          <div className="flex gap-3">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button variant="secondary" type="button" onClick={handleCancel} disabled={isLoading}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Full Name
              </label>
              <p className="text-neutral-900 bg-neutral-50 rounded-2xl px-4 py-2">
                {user.name || 'Not set'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                ZIP Code
              </label>
              <p className="text-neutral-900 bg-neutral-50 rounded-2xl px-4 py-2">
                {user.zipcode || 'Not set'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Email Address
              </label>
              <p className="text-neutral-600 bg-neutral-50 rounded-2xl px-4 py-2">
                {user.email}
              </p>
              <p className="text-xs text-neutral-500 mt-1">
                Email cannot be changed here. Manage through connected accounts.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Account Role
              </label>
              <p className="text-neutral-900 bg-neutral-50 rounded-2xl px-4 py-2 capitalize">
                {user.role}
              </p>
            </div>
          </div>

          <div className="pt-4">
            <Button onClick={() => setIsEditing(true)}>
              Edit Profile
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}