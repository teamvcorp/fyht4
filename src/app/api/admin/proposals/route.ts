// src/app/api/admin/proposals/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbconnect from '@/lib/mongoose'
import ProjectProposal from '@/models/ProjectProposal'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await dbconnect()

  // Optional pagination (defaults: limit 50, skip 0)
  const url = new URL(req.url)
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 100)
  const skip = Math.max(parseInt(url.searchParams.get('skip') || '0', 10), 0)

  // Always fetch only pending proposals
  const query = { status: 'pending' as const }

  const [docs, total] = await Promise.all([
    ProjectProposal.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    ProjectProposal.countDocuments(query),
  ])

  // Normalize for client (strings/ISO dates)
  const items = docs.map((p: any) => ({
    _id: String(p._id),
    title: p.title,
    category: p.category || '',
    zipcode: String(p.zipcode),
    shortDescription: p.shortDescription || '',
    description: p.description || '',
    fundingGoal: Number(p.fundingGoal || 0),
    voteGoal: Number(p.voteGoal || 0),
    createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : undefined,
    createdBy: p.createdBy ? String(p.createdBy) : undefined,
    status: p.status as 'pending' | 'approved' | 'rejected',
    adminNotes: p.adminNotes || '',
  }))

  return NextResponse.json({ items, total, skip, limit })
}
