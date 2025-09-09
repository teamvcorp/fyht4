'use client'

import { useEffect, useState } from 'react'
import { RootLayout } from '@/components/RootLayout'
import { Container } from '@/components/Container'
import { FadeIn } from '@/components/FadeIn'

type Item = {
  _id: string
  title: string
  zipcode?: string
  category?: string
  shortDescription?: string
  coverImage?: string | null
  status: 'voting' | 'funding' | 'build' | 'completed' | 'archived'
  voteGoal?: number
  votesYes?: number
  votesNo?: number
  fundingGoal?: number // cents
  totalRaised?: number // cents
  votePct: number
  fundPct: number
  canStartBuild: boolean
  canComplete: boolean
}

export default function AdminProjectsPage() {
  const [items, setItems] = useState<Item[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    try {
      setError(null)
      setLoading(true)
      const res = await fetch('/api/admin/projects', { cache: 'no-store' })
      if (res.status === 401 || res.status === 403) {
        setError('You must be an admin to view this page.')
        setItems([])
        return
      }
      const data = await res.json()
      setItems(data.items || [])
    } catch (e: any) {
      setError(e?.message || 'Failed to load projects')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function startBuild(id: string) {
    if (!confirm('Start build for this project? This requires vote & funding goals to be met.')) return
    const res = await fetch(`/api/admin/projects/${id}/transition`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'start_build' }),
    })
    if (!res.ok) {
      const msg = (await res.json().catch(() => ({})))?.error || 'Failed to start build'
      alert(msg)
      return
    }
    await load()
  }

  async function markComplete(id: string) {
    const date = window.prompt('Grand opening date (YYYY-MM-DD). Leave blank for today:', '')
    const payload: any = { action: 'complete' }
    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) payload.grandOpeningAt = date
    const res = await fetch(`/api/admin/projects/${id}/transition`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const msg = (await res.json().catch(() => ({})))?.error || 'Failed to mark completed'
      alert(msg)
      return
    }
    await load()
  }

  return (
    <RootLayout>
      <Container className="mt-24 sm:mt-32">
        <FadeIn>
          <h1 className="font-display text-4xl font-bold tracking-tight text-neutral-900">
            Admin • Projects
          </h1>
          <p className="mt-2 text-neutral-600">
            Review progress and move projects through <span className="font-medium">funding → build → completed</span>.
          </p>

          {error && (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
              {error}
            </div>
          )}

          {loading && (
            <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-6 text-neutral-600">
              Loading…
            </div>
          )}

          {items && items.length === 0 && !loading && !error && (
            <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-6 text-neutral-600">
              No projects yet.
            </div>
          )}

          {items && items.length > 0 && (
            <ul className="mt-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {items.map((p) => (
                <li key={p._id} className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm flex flex-col">
                  {/* cover */}
                  {p.coverImage ? (
                    <img src={p.coverImage} alt="" className="h-40 w-full rounded-2xl object-cover" />
                  ) : (
                    <div className="h-40 w-full rounded-2xl bg-neutral-100" />
                  )}

                  {/* header */}
                  <div className="mt-4">
                    <p className="text-xs uppercase tracking-wide text-neutral-500">
                      {p.category || 'Project'}{p.zipcode ? ` • ZIP ${p.zipcode}` : ''}
                    </p>
                    <h3 className="mt-1 font-semibold text-neutral-900">{p.title}</h3>
                    {p.shortDescription && (
                      <p className="mt-1 text-sm text-neutral-700 line-clamp-2">{p.shortDescription}</p>
                    )}
                    <StatusChip status={p.status} />
                  </div>

                  {/* progress */}
                  <div className="mt-4 space-y-3">
                    <div>
                      <div className="flex justify-between text-xs text-neutral-600 mb-1">
                        <span>Voting</span>
                        <span>{p.votesYes ?? 0} / {p.voteGoal ?? 0} ({p.votePct}%)</span>
                      </div>
                      <ProgressBar percent={p.votePct} />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-neutral-600 mb-1">
                        <span>Funding</span>
                        <span>
                          ${((p.totalRaised ?? 0) / 100).toLocaleString()} / ${((p.fundingGoal ?? 0) / 100).toLocaleString()} ({p.fundPct}%)
                        </span>
                      </div>
                      <ProgressBar percent={p.fundPct} accent="emerald" />
                    </div>
                  </div>

                  {/* actions */}
                  <div className="mt-5 flex gap-2">
                    <button
                      onClick={() => startBuild(p._id)}
                      disabled={!p.canStartBuild}
                      className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800 transition disabled:opacity-40"
                      title={p.canStartBuild ? 'Start Build' : 'Requires vote & funding goals met and status: funding'}
                    >
                      Start Build
                    </button>
                    <button
                      onClick={() => markComplete(p._id)}
                      disabled={!p.canComplete}
                      className="rounded-xl border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-800 hover:border-neutral-500 transition disabled:opacity-40"
                      title={p.canComplete ? 'Mark Completed' : 'Enabled in build stage'}
                    >
                      Mark Completed
                    </button>
                    <a
                      href={`/projects/${p._id}`}
                      className="ml-auto rounded-xl border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-800 hover:border-neutral-500 transition"
                    >
                      View
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </FadeIn>
      </Container>
    </RootLayout>
  )
}

function ProgressBar({ percent, accent = 'neutral' }: { percent: number; accent?: 'neutral' | 'emerald' }) {
  return (
    <div className="h-2 w-full rounded-full bg-neutral-100 overflow-hidden">
      <div
        className={`h-2 rounded-full ${accent === 'emerald' ? 'bg-emerald-600' : 'bg-neutral-900'}`}
        style={{ width: `${Math.max(0, Math.min(100, percent))}%` }}
      />
    </div>
  )
}

function StatusChip({ status }: { status: Item['status'] }) {
  const map: Record<Item['status'], string> = {
    voting: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    funding: 'bg-amber-50 text-amber-700 border-amber-200',
    build: 'bg-blue-50 text-blue-700 border-blue-200',
    completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    archived: 'bg-neutral-50 text-neutral-700 border-neutral-200',
  }
  return (
    <span
      className={`mt-2 inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${map[status]}`}
    >
      {status}
    </span>
  )
}
