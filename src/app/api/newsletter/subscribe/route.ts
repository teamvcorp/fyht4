import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

export const runtime = 'nodejs'

const resend = new Resend(process.env.RESEND_API_KEY!)

export async function POST(req: NextRequest) {
  try {
    const { email, firstName, lastName } = await req.json()
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
    }
    const audienceId = process.env.RESEND_AUDIENCE_ID!
    if (!audienceId) {
      return NextResponse.json({ error: 'Server misconfig: RESEND_AUDIENCE_ID missing' }, { status: 500 })
    }

    // Idempotent upsert (Resend will dedupe existing contacts)
    await resend.contacts.create({
      email,
      firstName,
      lastName,
      audienceId,
      unsubscribed: false,
    })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('Newsletter subscribe error:', e)
    return NextResponse.json({ error: 'Unable to subscribe' }, { status: 500 })
  }
}
