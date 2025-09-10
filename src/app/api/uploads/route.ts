import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const form = await req.formData()
  const file = form.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  // basic validation
  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Only images allowed' }, { status: 400 })
  }
  if (file.size > 8_000_000) {
    return NextResponse.json({ error: 'Max 8MB' }, { status: 400 })
  }

  // unique-ish name
  const ext = file.name.split('.').pop() || 'jpg'
  const key = `projects/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  // Upload to Blob (public is usually what you want for covers)
  const blob = await put(key, file, {
    access: 'public',
    // addRandomSuffix defaults to true; we set false since we already generated a unique name
    addRandomSuffix: false,
  })

  // blob.url is the public URL, blob.pathname is the path if you ever need to delete
  return NextResponse.json({
    url: blob.url,
    pathname: blob.pathname,
    contentType: blob.contentType,
  })
}
