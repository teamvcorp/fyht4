// components/projects/WatchButton.tsx
'use client'

import { useState } from 'react'

export default function WatchButton({
  projectId,
  initialWatching,
}: {
  projectId: string
  initialWatching: boolean
}) {
  const [watching, setWatching] = useState(initialWatching)
  const [busy, setBusy] = useState(false)

  async function toggle() {
    try {
      setBusy(true)
      if (watching) {
        const res = await fetch(`/api/watchlist?projectId=${projectId}`, { method: 'DELETE' })
        if (!res.ok) throw new Error('Failed to unwatch')
        setWatching(false)
      } else {
        const res = await fetch(`/api/watchlist`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ projectId }),
        })
        if (!res.ok) throw new Error('Failed to watch')
        setWatching(true)
      }
    } catch (e) {
      alert('Could not update watchlist. Please sign in first.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className={`rounded-2xl px-5 py-2 text-sm font-semibold transition ${
        watching
          ? 'bg-neutral-200 text-neutral-800'
          : 'bg-emerald-600 text-white hover:bg-emerald-700'
      } disabled:opacity-50`}
    >
      {busy ? '...' : watching ? 'Watching' : 'Watch this project'}
    </button>
  )
}
