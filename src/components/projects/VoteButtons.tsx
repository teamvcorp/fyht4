// components/projects/VoteButtons.tsx
'use client'

import { useState } from 'react'

export default function VoteButtons({ projectId }: { projectId: string }) {
  const [busy, setBusy] = useState<'yes' | 'no' | null>(null)
  const [msg, setMsg] = useState<string>('')

  async function vote(value: 'yes' | 'no') {
    try {
      setBusy(value)
      setMsg('')
      const res = await fetch(`/api/projects/${projectId}/vote`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ value }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Vote failed')
      setMsg(`Thanks! Yes: ${data.votesYes} • No: ${data.votesNo}`)
    } catch (e: any) {
      setMsg(e.message || 'Vote failed')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => vote('yes')}
        disabled={busy !== null}
        className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition disabled:opacity-50"
      >
        {busy === 'yes' ? 'Voting…' : 'Vote Yes'}
      </button>
      <button
        onClick={() => vote('no')}
        disabled={busy !== null}
        className="rounded-xl border border-neutral-300 px-3 py-2 text-xs font-semibold text-neutral-800 hover:border-neutral-500 transition disabled:opacity-50"
      >
        {busy === 'no' ? 'Voting…' : 'Vote No'}
      </button>
      {msg && <span className="ml-1 text-xs text-neutral-600">{msg}</span>}
    </div>
  )
}
