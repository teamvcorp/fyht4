import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { getAdminOrResponse } from '@/lib/guard'
import mongoose from 'mongoose'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(
req: NextRequest, ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params
  // Authz guard (returns a Response if not admin)
  const session = await getAdminOrResponse()
  if (session instanceof Response) return session

  try {
    const db = (await clientPromise).db()
    const body = await req.json().catch(() => ({}))
    const { action, grandOpeningAt } = body as {
      action: 'start_build' | 'complete'
      grandOpeningAt?: string
    }

    const projectId = new mongoose.Types.ObjectId(id)
    const project = await db.collection('projects').findOne({ _id: projectId })
    if (!project) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    if (action === 'start_build') {
      // Require both vote & funding goals AND the project must be in "funding"
      if (project.status !== 'funding') {
        return NextResponse.json(
          { error: 'Project is not ready for build (must be in funding stage)' },
          { status: 400 }
        )
      }
      const votesYes = Number(project.votesYes ?? 0)
      const voteGoal = Number(project.voteGoal ?? 0)
      if (votesYes < voteGoal) {
        return NextResponse.json({ error: 'Vote goal not reached' }, { status: 400 })
      }
      const totalRaised = Number(project.totalRaised ?? 0)
      const fundingGoal = Number(project.fundingGoal ?? 0)
      if (totalRaised < fundingGoal) {
        return NextResponse.json({ error: 'Funding goal not reached' }, { status: 400 })
      }

      await db.collection('projects').updateOne(
        { _id: projectId },
        { $set: { status: 'build', buildStartedAt: new Date() } }
      )
      return NextResponse.json({ ok: true })
    }

    if (action === 'complete') {
      const date = grandOpeningAt ? new Date(grandOpeningAt) : new Date()
      await db.collection('projects').updateOne(
        { _id: projectId },
        {
          $set: {
            status: 'completed',
            completedAt: new Date(),
            adminVerifiedComplete: true,
            grandOpeningAt: date,
          },
        }
      )
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err) {
    console.error('transition error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
