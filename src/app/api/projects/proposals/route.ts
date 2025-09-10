// src/app/api/projects/proposals/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbconnect from '@/lib/mongoose'
import ProjectProposal from '@/models/ProjectProposal'
import { Types } from 'mongoose'

export const runtime = 'nodejs'

// Helper: read JSON or form-encoded bodies (kept from your original)
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
  try {
    return await req.json()
  } catch {
    return {}
  }
}

export async function POST(req: NextRequest) {
  // auth (same behavior: 401 JSON when not signed in)
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await dbconnect()

  // parse body
  const body = (await readBody(req)) as Record<string, any>
  const {
    title,
    category,
    zipcode,
    shortDescription = '',
    description = '',
    fundingGoal,
    voteGoal,
  } = body

  // validate (same rules)
  if (!title || !zipcode || fundingGoal == null || voteGoal == null) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }
  if (!/^\d{5}(-\d{4})?$/.test(String(zipcode))) {
    return NextResponse.json({ error: 'Invalid zipcode' }, { status: 400 })
  }

  const fundingCents = Math.round(Number(fundingGoal) * 100)
  const voteGoalNum = Number(voteGoal)

  if (!Number.isFinite(fundingCents) || fundingCents < 100) {
    return NextResponse.json({ error: 'Funding goal must be at least $1' }, { status: 400 })
  }
  if (!Number.isFinite(voteGoalNum) || voteGoalNum < 1) {
    return NextResponse.json({ error: 'Vote goal must be ≥ 1' }, { status: 400 })
  }

  // insert via Mongoose (same fields, same defaults)
  const doc = await ProjectProposal.create({
    title: String(title).trim(),
    category: category ? String(category).trim() : 'General',
    zipcode: String(zipcode).trim(),
    shortDescription: String(shortDescription).trim(),
    description: String(description).trim(),
    fundingGoal: fundingCents,
    voteGoal: voteGoalNum,
    createdBy: new Types.ObjectId((session.user as any).id),
    status: 'pending',
    adminNotes: '',
  })

  // Preserve original behavior:
  // If Accept: text/html (from a form submit), redirect with 303
  const accept = req.headers.get('accept') || ''
  if (accept.includes('text/html')) {
    const url = new URL('/dashboard?submitted=1', req.url)
    return NextResponse.redirect(url, { status: 303 })
  }

  // Otherwise return JSON
  return NextResponse.json({ ok: true, id: String(doc._id) })
}
