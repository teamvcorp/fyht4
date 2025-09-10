// src/app/api/projects/[id]/vote/route.ts
import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { getSessionOrResponse } from '@/lib/guard'
import { ObjectId } from 'mongodb'
import Project from '@/models/Project'
import dbConnect from '@/lib/mongoose'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  await dbConnect()
  const {id} = await ctx.params
  // Auth: return 401 JSON if not signed in
  const session = await getSessionOrResponse()
  if (session instanceof Response) return session

  const db = (await clientPromise).db()

  // Read the voter's ZIP from profile
  const user = await db.collection('users').findOne(
    { _id: new ObjectId(session.user.id) },
    { projection: { zipcode: 1 } },
  )

  // Parse body
  const body = await req.json().catch(() => ({}))
  const value = String(body.value || '').toLowerCase() as 'yes' | 'no'
  if (!['yes', 'no'].includes(value)) {
    return NextResponse.json({ error: 'value must be "yes" or "no"' }, { status: 400 })
  }

  // Load project and validate status
  const projectId = new ObjectId(id)
  const project = await Project.findById(id).lean()
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  if (project.status !== 'voting') {
    return NextResponse.json({ error: 'Voting is not open for this project' }, { status: 400 })
  }

  // Enforce local voting by ZIP
  if (!user?.zipcode || String(user.zipcode) !== String(project.zipcode)) {
    return NextResponse.json({ error: 'You must live in the project ZIP to vote' }, { status: 403 })
  }

  // One vote per user per project
  const voteDoc = {
    projectId,
    userId: new ObjectId(session.user.id),
    zipcode: String(user.zipcode),
    value,
    createdAt: new Date(),
  }

  try {
    await db.collection('project_votes').insertOne(voteDoc) // unique index enforces one vote per (projectId,userId)
  } catch {
    return NextResponse.json({ error: 'You already voted on this project' }, { status: 409 })
  }

  // Increment counters
  const inc = value === 'yes' ? { votesYes: 1 } : { votesNo: 1 }
  const updated = await db.collection('projects').findOneAndUpdate(
    { _id: projectId },
    { $inc: inc },
    {
      returnDocument: 'after',
      projection: {
        votesYes: 1,
        votesNo: 1,
        voteGoal: 1,
        status: 1,
        fundingGoal: 1,
        totalRaised: 1,
      },
    },
  )

  const now = updated.value
  // Auto-advance to funding once YES votes meet goal (only if still in voting)
  if (now && now.status === 'voting' && Number(now.votesYes) >= Number(now.voteGoal)) {
    await db.collection('projects').updateOne(
      { _id: projectId },
      { $set: { status: 'funding' } },
    )
  }

  return NextResponse.json({
    ok: true,
    votesYes: now?.votesYes ?? 0,
    votesNo: now?.votesNo ?? 0,
  })
}
