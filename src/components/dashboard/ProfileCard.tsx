'use client'

import { useState } from 'react'

export default function ProfileCard({
  user,
}: {
  user: { id: string; name: string; email: string; zipcode: string }
}) {
  const [name, setName] = useState(user.name)
  const [zipcode, setZipcode] = useState(user.zipcode)
  const [saving, setSaving] = useState(false)

  async function save() {
    if (zipcode && !/^\d{5}(-\d{4})?$/.test(zipcode)) {
      alert('Please enter a valid US ZIP (e.g., 12345).')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, zipcode }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save')
      // Optional: toast
    } catch (e: any) {
      alert(e.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-3xl border border-neutral-200 bg-white p-6 sm:p-8 shadow-sm">
      <h2 className="font-display text-2xl sm:text-3xl font-semibold text-neutral-900">Your profile</h2>
      <p className="mt-2 text-neutral-600">Update your name and ZIP to personalize your dashboard.</p>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-800">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-neutral-500"
            placeholder="Your name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-800">Email</label>
          <input
            disabled
            value={user.email}
            className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-neutral-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-800">Home ZIP code</label>
          <input
            value={zipcode}
            onChange={(e) => setZipcode(e.target.value)}
            className="mt-1 w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-neutral-500"
            placeholder="e.g., 50588"
          />
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="rounded-2xl bg-neutral-900 px-6 py-3 text-white font-semibold hover:bg-neutral-800 transition disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
        <a
          href="/membership"
          className="rounded-2xl border border-neutral-300 px-6 py-3 font-semibold text-neutral-800 hover:border-neutral-500 transition"
        >
          Manage account
        </a>
      </div>
    </div>
  )
}
