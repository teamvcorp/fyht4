'use client'

import { useState } from 'react'
import { RootLayout } from '@/components/RootLayout'
import { Container } from '@/components/Container'
import { FadeIn } from '@/components/FadeIn'

type UploadResp = { url: string; pathname: string; size?: number; contentType?: string }

export default function SubmitProjectPage() {
  const [coverUrl, setCoverUrl] = useState<string>('')
  const [coverPathname, setCoverPathname] = useState<string>('')
  const [uploading, setUploading] = useState(false)
  const [uploadErr, setUploadErr] = useState<string>('')

  async function uploadCover(file: File) {
    setUploadErr('')
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/uploads', { method: 'POST', body: fd })
      if (!res.ok) {
        const msg = (await res.json().catch(() => ({})))?.error || 'Upload failed'
        throw new Error(msg)
      }
      const data = (await res.json()) as UploadResp
      setCoverUrl(data.url)
      setCoverPathname(data.pathname)
    } catch (e: any) {
      setCoverUrl('')
      setCoverPathname('')
      setUploadErr(e?.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) uploadCover(f)
  }

  return (
    <RootLayout>
      <Container className="mt-24 sm:mt-32">
        <FadeIn className="mx-auto max-w-3xl">
          <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-neutral-900">
            Submit a project proposal
          </h1>
          <p className="mt-3 text-neutral-600">
            Share your idea. After admin review, approved proposals move to the community voting stage.
          </p>

          <form
            action="/api/projects/proposals"
            method="POST"
            className="mt-8 rounded-3xl border border-neutral-200 bg-white p-6 sm:p-8 shadow-sm"
          >
            {/* Hidden fields populated after the image upload */}
            <input type="hidden" name="coverImage" value={coverUrl} />
            <input type="hidden" name="coverPathname" value={coverPathname} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Cover image (upload to Blob first) */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-neutral-800">Cover image (JPG/PNG, max 8MB)</label>
                <div className="mt-1 flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={onFileChange}
                    className="block w-full text-sm text-neutral-700 file:mr-3 file:rounded-xl file:border file:border-neutral-300 file:bg-white file:px-4 file:py-2 file:text-sm file:font-medium hover:file:border-neutral-500"
                  />
                </div>

                {/* Upload status / preview */}
                {uploading && (
                  <p className="mt-2 text-sm text-neutral-600">Uploading…</p>
                )}
                {uploadErr && (
                  <p className="mt-2 text-sm text-red-600">{uploadErr}</p>
                )}
                {coverUrl && (
                  <div className="mt-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={coverUrl}
                      alt="Cover preview"
                      className="h-40 w-full rounded-2xl object-cover"
                    />
                    <p className="mt-1 text-xs text-neutral-500 break-all">{coverUrl}</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-800">Title *</label>
                <input
                  name="title"
                  required
                  className="mt-1 w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-neutral-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-800">Category *</label>
                <select
                  name="category"
                  required
                  className="mt-1 w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-neutral-500"
                  defaultValue=""
                >
                  <option value="" disabled>
                    Select category
                  </option>
                  <option value="Housing">Housing</option>
                  <option value="Education">Education</option>
                  <option value="Health">Health</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-800">ZIP code *</label>
                <input
                  name="zipcode"
                  required
                  pattern="\d{5}(-\d{4})?"
                  className="mt-1 w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-neutral-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-800">Funding goal (USD) *</label>
                <input
                  name="fundingGoal"
                  type="number"
                  min="1"
                  step="1"
                  required
                  className="mt-1 w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-neutral-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-800">Vote goal (# yes votes) *</label>
                <input
                  name="voteGoal"
                  type="number"
                  min="100"
                  step="1"
                  required
                  className="mt-1 w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-neutral-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-neutral-800">Short description</label>
                <input
                  name="shortDescription"
                  className="mt-1 w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-neutral-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-neutral-800">Full description</label>
                <textarea
                  name="description"
                  rows={6}
                  className="mt-1 w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-neutral-500"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                className="rounded-2xl bg-emerald-600 px-6 py-3 text-white font-semibold hover:bg-emerald-700 transition disabled:opacity-50"
                // Optional: require an uploaded cover before submit.
                // Remove "disabled" if you want to allow cover to be optional.
                disabled={uploading}
                title={uploading ? 'Please wait for the image to finish uploading' : undefined}
              >
                Submit proposal
              </button>
              <a
                href="/dashboard"
                className="rounded-2xl border border-neutral-300 px-6 py-3 font-semibold text-neutral-800 hover:border-neutral-500 transition"
              >
                Cancel
              </a>
            </div>
          </form>

          {/* Note:
              - Your /api/projects/proposals route must accept and store `coverImage` (the Blob URL).
              - If you also sent `coverPathname`, keep it in DB to support future deletes/replacements.
          */}
        </FadeIn>
      </Container>
    </RootLayout>
  )
}
