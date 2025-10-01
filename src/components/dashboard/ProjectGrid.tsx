'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { VotingSystem } from '@/components/projects/VotingSystem'

export default function ProjectGrid({
  items,
  emptyText,
}: {
  items: any[]
  emptyText: string
}) {
  if (!items?.length) {
    return (
      <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-6 text-neutral-600">
        {emptyText}
      </div>
    )
  }
  return (
    <ul className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((p) => (
        <ProjectCard key={String(p._id)} project={p} />
      ))}
    </ul>
  )
}

function ProjectCard({ project }: { project: any }) {
  const { data: session } = useSession()
  const [watching, setWatching] = useState<boolean | null>(project._watching ?? null)
  const [busy, setBusy] = useState(false)
  const [userZipcode, setUserZipcode] = useState<string | null>(null)
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false)

  useEffect(() => {
    if (session?.user) {
      loadUserData()
    }
  }, [session])

  const loadUserData = async () => {
    try {
      const res = await fetch('/api/profile')
      const data = await res.json()
      if (data.success) {
        setUserZipcode(data.user.zipcode)
        setHasActiveSubscription(data.user.hasActiveSubscription || false)
      }
    } catch (error) {
      console.error('Failed to load user data:', error)
    }
  }

  async function toggleWatch() {
    try {
      setBusy(true)
      const method = watching ? 'DELETE' : 'POST'
      const qs = watching ? `?projectId=${project._id}` : ''
      const res = await fetch(`/api/watchlist${qs}`, {
        method,
        headers: { 'content-type': 'application/json' },
        body: watching ? undefined : JSON.stringify({ projectId: project._id }),
      })
      if (!res.ok) throw new Error('Failed to update watchlist')
      setWatching(!watching)
    } catch (e) {
      alert('Could not update watchlist')
    } finally {
      setBusy(false)
    }
  }

  return (
    <li className="rounded-2xl border border-neutral-200 bg-white p-4 flex flex-col">
      {project.coverImage ? (
        <div className="h-40 w-full rounded-xl overflow-hidden bg-neutral-100">
          {/* Use regular img for external URLs to avoid Next.js config issues */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={project.coverImage}
            alt=""
            className="h-40 w-full rounded-xl object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
              e.currentTarget.parentElement!.innerHTML = '<div class="h-40 w-full rounded-xl bg-neutral-100 flex items-center justify-center"><span class="text-neutral-400 text-sm">Image unavailable</span></div>'
            }}
          />
        </div>
      ) : (
        <div className="h-40 w-full rounded-xl bg-neutral-100" />
      )}
      <div className="mt-4">
        <p className="text-sm uppercase tracking-wide text-neutral-500">{project.category}</p>
        <h3 className="mt-1 font-semibold text-neutral-900">{project.title}</h3>
        <p className="mt-1 text-sm text-neutral-700 line-clamp-3">{project.shortDescription}</p>
        <p className="mt-2 text-xs text-neutral-500">ZIP {project.zipcode}</p>
      </div>
      
      {/* Voting System for voting projects */}
      {project.status === 'voting' && (
        <div className="mt-3">
          <VotingSystem
            projectId={project._id}
            projectStatus={project.status}
            projectZipcode={project.zipcode}
            initialVotesYes={project.votesYes || 0}
            initialVotesNo={project.votesNo || 0}
            voteGoal={project.voteGoal || 0}
            userZipcode={userZipcode}
            hasActiveSubscription={hasActiveSubscription}
            className="text-sm"
          />
        </div>
      )}
      
      <div className="mt-4 flex gap-2">
        <a
          href={`/projects/${project._id}`}
          className="rounded-xl border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-800 hover:border-neutral-500 transition"
        >
          View
        </a>
        <button
          onClick={toggleWatch}
          disabled={busy}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
            watching
              ? 'bg-neutral-200 text-neutral-800'
              : 'bg-emerald-600 text-white hover:bg-emerald-700'
          }`}
        >
          {busy ? '...' : watching ? 'Watching' : 'Watch'}
        </button>
      </div>
    </li>
  )
}
