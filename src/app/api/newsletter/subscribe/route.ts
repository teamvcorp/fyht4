// src/app/api/newsletter/subscribe/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

export const runtime = 'nodejs'

const resend = new Resend(process.env.RESEND_API_KEY!)

// Parse JSON or form-encoded bodies
async function readBody(req: NextRequest) {
  const ct = req.headers.get('content-type') || ''
  if (ct.includes('application/json')) {
    return await req.json()
  }
  if (ct.includes('application/x-www-form-urlencoded') || ct.includes('multipart/form-data')) {
    const fd = await req.formData()
    const obj: Record<string, string> = {}
    for (const [k, v] of fd.entries()) obj[k] = String(v)
    return obj
  }
  // Fallback: try JSON, otherwise empty object
  try {
    return await req.json()
  } catch {
    return {}
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await readBody(req)
    const email = String(body.email || '').trim().toLowerCase()
    const firstName = body.firstName ? String(body.firstName).trim() : undefined
    const lastName = body.lastName ? String(body.lastName).trim() : undefined

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
    }

    const audienceId = process.env.RESEND_AUDIENCE_ID
    if (!audienceId) {
      return NextResponse.json({ error: 'Server misconfig: RESEND_AUDIENCE_ID missing' }, { status: 500 })
    }

    // Idempotent upsert into Resend Audience (Resend dedupes by email)
    await resend.contacts.create({
      audienceId,
      email,
      firstName,
      lastName,
      unsubscribed: false,
    })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('Newsletter subscribe error:', e)
    return NextResponse.json({ error: 'Unable to subscribe' }, { status: 500 })
  }
}
