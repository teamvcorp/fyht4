// src/app/api/projects/proposals/route.ts
import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ObjectId } from 'mongodb'

export const runtime = 'nodejs'

// Helper: read JSON or form-encoded bodies
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
  // fallback
  try { return await req.json() } catch { return {} }
}

export async function POST(req: NextRequest) {
  // auth
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // parse body
  const body = await readBody(req)
  const {
    title,
    category,
    zipcode,
    shortDescription = '',
    description = '',
    fundingGoal,
    voteGoal,
  } = body as Record<string, any>

  // validate
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

  // insert
  const db = (await clientPromise).db()
  const doc = {
    title: String(title).trim(),
    category: category ? String(category).trim() : 'General',
    zipcode: String(zipcode),
    shortDescription: String(shortDescription).trim(),
    description: String(description).trim(),
    fundingGoal: fundingCents,
    voteGoal: voteGoalNum,
    createdBy: new ObjectId(session.user.id),
    createdAt: new Date(),
    status: 'pending' as const,
    adminNotes: '',
  }

  const res = await db.collection('project_proposals').insertOne(doc)

  // If the request came from an HTML form, redirect to a friendly page
  const accept = req.headers.get('accept') || ''
  if (accept.includes('text/html')) {
    const url = new URL('/dashboard?submitted=1', req.url)
    return NextResponse.redirect(url, { status: 303 })
  }

  // Otherwise return JSON
  return NextResponse.json({ ok: true, id: String(res.insertedId) })
}
