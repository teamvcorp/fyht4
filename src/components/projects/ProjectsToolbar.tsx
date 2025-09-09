// components/projects/ProjectsToolbar.tsx
'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useMemo, useState, useEffect } from 'react'

export default function ProjectsToolbar({
  initialSort,
  initialQuery,
}: {
  initialSort?: string
  initialQuery?: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [sort, setSort] = useState(initialSort || 'latest')
  const [q, setQ] = useState(initialQuery || '')

  // keep URL → state in sync on back/forward
  useEffect(() => {
    setSort(searchParams.get('sort') || 'latest')
    setQ(searchParams.get('q') || '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()])

  function apply() {
    const params = new URLSearchParams(searchParams.toString())
    sort ? params.set('sort', sort) : params.delete('sort')
    q ? params.set('q', q) : params.delete('q')
    router.replace(`/projects?${params.toString()}`)
  }

  function onKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') apply()
  }

  const sorts = useMemo(
    () => [
      { value: 'latest', label: 'Latest' },
      { value: 'zipcode', label: 'ZIP code' },
      { value: 'city', label: 'City' },
      { value: 'state', label: 'State' },
    ],
    []
  )

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex w-full items-center gap-2 sm:w-auto">
        <label className="text-sm text-neutral-700">Sort by</label>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="rounded-xl border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-600"
        >
          {sorts.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex w-full items-center gap-2 sm:w-96">
        <input
          type="search"
          value={q}
          placeholder="Search title, ZIP, city, state…"
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={onKey}
          className="flex-1 rounded-xl border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-600"
        />
        <button
          onClick={apply}
          className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800 transition"
        >
          Apply
        </button>
      </div>
    </div>
  )
}
