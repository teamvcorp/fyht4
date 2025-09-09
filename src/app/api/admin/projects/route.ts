import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { getAdminOrResponse } from '@/lib/guard'

export const runtime = 'nodejs'

export async function GET() {
  const session = await getAdminOrResponse()
  if (session instanceof Response) return session

  const db = (await clientPromise).db()
  const items = await db
    .collection('projects')
    .find({}, { projection: {
      title: 1, zipcode: 1, category: 1, shortDescription: 1, coverImage: 1,
      status: 1, voteGoal: 1, votesYes: 1, votesNo: 1, fundingGoal: 1, totalRaised: 1,
      createdAt: 1, approvedAt: 1, buildStartedAt: 1, completedAt: 1, grandOpeningAt: 1,
    }})
    .sort({ createdAt: -1 })
    .limit(100)
    .toArray()

  const mapped = items.map((p: any) => {
    const votePct = p.voteGoal > 0 ? Math.min(100, Math.round((Number(p.votesYes || 0) / Number(p.voteGoal)) * 100)) : 0
    const fundPct = p.fundingGoal > 0 ? Math.min(100, Math.round((Number(p.totalRaised || 0) / Number(p.fundingGoal)) * 100)) : 0
    const canStartBuild = p.status === 'funding' && votePct >= 100 && fundPct >= 100
    const canComplete = p.status === 'build'
    return { ...p, _id: String(p._id), votePct, fundPct, canStartBuild, canComplete }
  })

  return NextResponse.json({ items: mapped })
}
