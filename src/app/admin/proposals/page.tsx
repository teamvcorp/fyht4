'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { RootLayout } from '@/components/RootLayout'
import { Container } from '@/components/Container'
import { FadeIn } from '@/components/FadeIn'

/** Mirror the server model (ProjectProposal) as a DTO for the client */
type ProposalDTO = {
  _id: string
  title: string
  category?: string
  zipcode: string
  shortDescription?: string
  description?: string
  fundingGoal: number   // cents
  voteGoal: number
  createdAt?: string
  createdBy?: string
  status: 'pending' | 'approved' | 'rejected'
}

export default function AdminProposalsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [items, setItems] = useState<ProposalDTO[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({})
  const [busyId, setBusyId] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  async function load() {
    try {
      setError(null)
      setLoading(true)
      const res = await fetch('/api/admin/proposals', { cache: 'no-store' })

      if (!res.ok) {
        const msg = (await res.json().catch(() => ({})))?.error || 'Failed to load proposals'
        setError(msg)
        setItems([])
        return
      }

      const data = await res.json()

      // Normalize API docs (from Mongoose ProjectProposal) into client-safe DTOs
      const normalized: ProposalDTO[] = (data.items || []).map((p: any) => ({
        _id: String(p._id),
        title: String(p.title),
        category: p.category || '',
        zipcode: String(p.zipcode),
        shortDescription: p.shortDescription || '',
        description: p.description || '',
        fundingGoal: Number(p.fundingGoal || 0),
        voteGoal: Number(p.voteGoal || 0),
        createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : undefined,
        createdBy: p.createdBy ? String(p.createdBy) : undefined,
        status: p.status as 'pending' | 'approved' | 'rejected',
      }))

      setItems(normalized)
    } catch (e: any) {
      setError(e?.message || 'Failed to load proposals')
    } finally {
      setLoading(false)
    }
  }

  // Gate: only admins can load
  useEffect(() => {
    if (status === 'loading') return

    if (!session?.user) {
      router.replace('/membership?from=/admin/proposals')
      return
    }
    if (session.user.role !== 'admin') {
      setError('You must be an admin to view this page.')
      setItems([])
      return
    }

    load()
  }, [status, session, router])

  function setNote(id: string, v: string) {
    setNoteDrafts(prev => ({ ...prev, [id]: v }))
  }

  async function act(id: string, action: 'approve' | 'reject') {
    try {
      setBusyId(id)
      const adminNotes = (noteDrafts[id] || '').trim()

      if (action === 'reject' && !adminNotes) {
        alert('Please add admin notes for rejection.')
        setBusyId(null)
        return
      }

      const res = await fetch(`/api/admin/proposals/${id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action, adminNotes }),
      })

      if (!res.ok) {
        const msg = (await res.json().catch(() => ({})))?.error || 'Action failed'
        alert(msg)
        return
      }

      // Remove processed proposal from the list
      setItems(prev => (prev ? prev.filter(p => p._id !== id) : prev))

      // Clean up note
      setNoteDrafts(prev => {
        const { [id]: _, ...rest } = prev
        return rest
      })
    } finally {
      setBusyId(null)
    }
  }

  function toggleExpand(id: string) {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <RootLayout>
      <Container className="mt-24 sm:mt-32">
        <FadeIn>
          <h1 className="font-display text-4xl font-bold tracking-tight text-neutral-900">
            Admin • Proposals
          </h1>
          <p className="mt-2 text-neutral-600">
            Review member submissions and move approved proposals into the public project list (status:{' '}
            <span className="font-medium">voting</span>).
          </p>

          {error && (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
              {error}
            </div>
          )}

          {(status === 'loading' || loading) && (
            <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-6 text-neutral-600">
              Loading…
            </div>
          )}

          {items && items.length === 0 && !loading && !error && (
            <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-6 text-neutral-600">
              No pending proposals.
            </div>
          )}

          {items && items.length > 0 && (
            <ul className="mt-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {items.map(p => {
                const dollars = (p.fundingGoal || 0) / 100
                const isBusy = busyId === p._id
                const isOpen = !!expanded[p._id]
                return (
                  <li key={p._id} className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm flex flex-col">
                    {/* Header */}
                    <div>
                      <p className="text-xs uppercase tracking-wide text-neutral-500">
                        {p.category || 'Proposal'} • ZIP {p.zipcode}
                      </p>
                      <h3 className="mt-1 font-semibold text-neutral-900">{p.title}</h3>
                      <p className="mt-1 text-xs text-neutral-500">
                        Goal: ${Math.round(dollars).toLocaleString()} • Votes needed: {p.voteGoal}
                      </p>
                    </div>

                    {/* Description */}
                    <div className="mt-3">
                      {p.shortDescription && (
                        <p className="text-sm text-neutral-700">{p.shortDescription}</p>
                      )}
                      {p.description && (
                        <>
                          {!isOpen ? (
                            <button
                              onClick={() => toggleExpand(p._id)}
                              className="mt-2 text-sm underline text-neutral-700 hover:text-neutral-900"
                            >
                              Read full description →
                            </button>
                          ) : (
                            <div className="mt-2">
                              <p className="text-sm text-neutral-700 whitespace-pre-line">
                                {p.description}
                              </p>
                              <button
                                onClick={() => toggleExpand(p._id)}
                                className="mt-2 text-sm underline text-neutral-700 hover:text-neutral-900"
                              >
                                Collapse
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Admin notes */}
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-neutral-800">
                        Admin notes
                      </label>
                      <textarea
                        value={noteDrafts[p._id] || ''}
                        onChange={e => setNote(p._id, e.target.value)}
                        rows={3}
                        className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500"
                        placeholder="Reason for decision, constraints, requested edits…"
                      />
                    </div>

                    {/* Actions */}
                    <div className="mt-5 flex gap-2">
                      <button
                        onClick={() => act(p._id, 'approve')}
                        disabled={isBusy}
                        className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800 transition disabled:opacity-50"
                        title="Approve and create a public project (voting stage)"
                      >
                        {isBusy ? 'Working…' : 'Approve'}
                      </button>
                      <button
                        onClick={() => act(p._id, 'reject')}
                        disabled={isBusy}
                        className="rounded-xl border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-800 hover:border-neutral-500 transition disabled:opacity-50"
                        title="Reject (admin notes recommended)"
                      >
                        {isBusy ? 'Working…' : 'Reject'}
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </FadeIn>
      </Container>
    </RootLayout>
  )
}
