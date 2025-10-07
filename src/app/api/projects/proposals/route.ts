// src/app/api/projects/proposals/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { requireMonthlySubscriber } from '@/lib/guard'
import dbConnect from '@/lib/mongoose'
import ProjectProposal from '@/models/ProjectProposal'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sanitizeProjectData } from '@/lib/sanitize'
import { validateZipcode, validateFundingGoal, validateVoteGoal } from '@/lib/validation'
import { checkRateLimit, rateLimiters } from '@/lib/rateLimit'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const gate = await requireMonthlySubscriber()
  if (gate instanceof Response) return gate

  const session = await getServerSession(authOptions)
  
  // Rate limit project submissions (moderate: 20/hour)
  const identifier = `project-proposal:${(gate as any).session.user.id}`
  const rateLimitResult = checkRateLimit(identifier, rateLimiters.moderate)
  if (!rateLimitResult.allowed) {
    return rateLimitResult.response!
  }

  const body = await (async () => {
    const ct = req.headers.get('content-type') || ''
    if (ct.includes('application/json')) return req.json()
    if (ct.includes('application/x-www-form-urlencoded') || ct.includes('multipart/form-data')) {
      const fd = await req.formData()
      return Object.fromEntries(fd.entries())
    }
    try { return await req.json() } catch { return {} }
  })()

  const { title, category, zipcode, city, state, shortDescription = '', description = '', fundingGoal, voteGoal } =
    body as Record<string, any>

  if (!title || !zipcode || fundingGoal == null || voteGoal == null) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Validate zipcode
  if (!validateZipcode(String(zipcode))) {
    return NextResponse.json({ error: 'Invalid zipcode format' }, { status: 400 })
  }

  // Validate funding goal
  const fundingCents = Math.round(Number(fundingGoal) * 100)
  const fundingValidation = validateFundingGoal(fundingCents / 100)
  if (!fundingValidation.valid) {
    return NextResponse.json({ error: fundingValidation.error }, { status: 400 })
  }

  // Validate vote goal
  const voteGoalNum = Number(voteGoal)
  const voteValidation = validateVoteGoal(voteGoalNum)
  if (!voteValidation.valid) {
    return NextResponse.json({ error: voteValidation.error }, { status: 400 })
  }

  // Sanitize all text inputs
  const sanitized = sanitizeProjectData({
    title: String(title),
    category: category ? String(category) : 'General',
    city: city ? String(city) : '',
    state: state ? String(state) : '',
    shortDescription: String(shortDescription),
    description: String(description),
  })

  await dbConnect()
  const doc = await ProjectProposal.create({
    title: sanitized.title,
    category: sanitized.category,
    zipcode: String(zipcode),
    city: sanitized.city || null,
    state: sanitized.state || null,
    shortDescription: sanitized.shortDescription,
    description: sanitized.description,
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
