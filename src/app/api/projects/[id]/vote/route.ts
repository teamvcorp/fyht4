// src/app/api/projects/[id]/vote/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import mongoose, {Types} from 'mongoose'
import dbConnect from '@/lib/mongoose'
import { requireMonthlySubscriber } from '@/lib/guard'
import UserModel, { IUser } from '@/models/User'
import Project, { IProject } from '@/models/Project'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> } // <-- params is a Promise in Next 15
) {
  const { id } = await params

  // Require active monthly subscriber (your guard returns Response or { session })
  const gate = await requireMonthlySubscriber()
  if (gate instanceof Response) return gate
  const { session } = gate as { session: { user: { id: string } } }

  // Validate body
  const body = await req.json().catch(() => ({}))
  const value = String(body.value || '').toLowerCase()
  if (value !== 'yes' && value !== 'no') {
    return NextResponse.json({ error: 'value must be "yes" or "no"' }, { status: 400 })
  }

  await dbConnect()

  // Get user's zipcode (typed)
  const user = await UserModel.findById(session.user.id)
    .select('zipcode')
    .lean<Pick<IUser, '_id' | 'zipcode'> | null>()

  // Get project (typed)
  const project = ObjectId.isValid(id)
    ? await Project.findById(id).lean<IProject | null>()
    : null

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }
  if (project.status !== 'voting') {
    return NextResponse.json({ error: 'Voting is not open for this project' }, { status: 400 })
  }

  // ZIP rule
  if (!user?.zipcode || String(user.zipcode) !== String(project.zipcode)) {
    return NextResponse.json({ error: 'You must live in the project ZIP to vote' }, { status: 403 })
  }

  // One vote per user per project (unique index should enforce this)
  try {
    await mongoose.connection.collection('project_votes').insertOne({
      projectId: project._id as Types.ObjectId,     // ✅ already an ObjectId
      userId: new Types.ObjectId(session.user.id),  // ✅ use the same flavor
      zipcode: String(user.zipcode),
      value,
      createdAt: new Date(),
    })
  } catch {
    return NextResponse.json({ error: 'You already voted on this project' }, { status: 409 })
  }

  // Increment counters (typed return)
  const inc = value === 'yes' ? { votesYes: 1 } : { votesNo: 1 }
  const updated = await Project.findByIdAndUpdate(
    project._id,
    { $inc: inc },
    {
      new: true,
      projection: { votesYes: 1, votesNo: 1, voteGoal: 1, status: 1 },
    }
  ).lean<Pick<IProject, 'votesYes' | 'votesNo' | 'voteGoal' | 'status'> | null>()

  // Auto-advance to funding
  if (updated && updated.status === 'voting' && Number(updated.votesYes) >= Number(updated.voteGoal)) {
    await Project.updateOne({ _id: project._id }, { $set: { status: 'funding' } })
  }

  return NextResponse.json({
    ok: true,
    votesYes: updated?.votesYes ?? 0,
    votesNo: updated?.votesNo ?? 0,
  })
}
