// src/app/api/projects/proposals/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { requireMonthlySubscriber } from '@/lib/guard'
import dbConnect from '@/lib/mongoose'
import ProjectProposal from '@/models/ProjectProposal'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const gate = await requireMonthlySubscriber()
  if (gate instanceof Response) return gate

  const session = await getServerSession(authOptions)
  const body = await (async () => {
    const ct = req.headers.get('content-type') || ''
    if (ct.includes('application/json')) return req.json()
    if (ct.includes('application/x-www-form-urlencoded') || ct.includes('multipart/form-data')) {
      const fd = await req.formData()
      return Object.fromEntries(fd.entries())
    }
    try { return await req.json() } catch { return {} }
  })()

  const { title, category, zipcode, shortDescription = '', description = '', fundingGoal, voteGoal } =
    body as Record<string, any>

  if (!title || !zipcode || fundingGoal == null || voteGoal == null) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const fundingCents = Math.round(Number(fundingGoal) * 100)
  const voteGoalNum = Number(voteGoal)
  if (!Number.isFinite(fundingCents) || fundingCents < 100) {
    return NextResponse.json({ error: 'Funding goal must be at least $1' }, { status: 400 })
  }
  if (!Number.isFinite(voteGoalNum) || voteGoalNum < 1) {
    return NextResponse.json({ error: 'Vote goal must be ≥ 1' }, { status: 400 })
  }

  await dbConnect()
  const doc = await ProjectProposal.create({
    title: String(title).trim(),
    category: category ? String(category).trim() : 'General',
    zipcode: String(zipcode),
    shortDescription: String(shortDescription).trim(),
    description: String(description).trim(),
    fundingGoal: fundingCents,
    voteGoal: voteGoalNum,
    createdBy: (gate as any).session.user.id,
    status: 'pending',
  })

  const accept = req.headers.get('accept') || ''
  if (accept.includes('text/html')) {
    return NextResponse.redirect(new URL('/dashboard?submitted=1', req.url), { status: 303 })
  }
  return NextResponse.json({ ok: true, id: String(doc._id) })
}
