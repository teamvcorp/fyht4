// src/app/api/projects/[id]/vote/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import mongoose, {Types} from 'mongoose'
import dbConnect from '@/lib/mongoose'
import UserModel, { IUser } from '@/models/User'
import Project, { IProject } from '@/models/Project'
import ProjectVote from '@/models/ProjectVote'
import { checkRateLimit, rateLimiters } from '@/lib/rateLimit'
import { safeObjectId } from '@/lib/mongoSafe'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> } // <-- params is a Promise in Next 15
) {
  const { id } = await params

  // Get session first
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Rate limit voting (moderate: 20/hour)
  const identifier = `vote:${session.user.id}`
  const rateLimitResult = checkRateLimit(identifier, rateLimiters.moderate)
  if (!rateLimitResult.allowed) {
    return rateLimitResult.response!
  }

  // Do a real-time database check for subscription status (bypass JWT cache)
  await dbConnect()
  const user = await UserModel.findById(session.user.id)
    .select('role activeSubscription zipcode')
    .lean<Pick<IUser, '_id' | 'role' | 'activeSubscription' | 'zipcode'> | null>()

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Check if user has active monthly subscription
  const hasActiveSubscription = user.activeSubscription ? 
    (user.activeSubscription.status === 'active' || user.activeSubscription.status === 'trialing') &&
    user.activeSubscription.interval === 'month' &&
    user.activeSubscription.currentPeriodEnd &&
    new Date(user.activeSubscription.currentPeriodEnd).getTime() > Date.now()
    : false

  const isAdmin = user.role === 'admin'

  if (!isAdmin && !hasActiveSubscription) {
    return NextResponse.json(
      { error: 'You must be an active monthly subscriber to perform this action.' },
      { status: 403 }
    )
  }

  // Validate body
  const body = await req.json().catch(() => ({}))
  const value = String(body.value || '').toLowerCase()
  if (value !== 'yes' && value !== 'no') {
    return NextResponse.json({ error: 'value must be "yes" or "no"' }, { status: 400 })
  }

  await dbConnect()

  // Safely convert project ID to ObjectId
  const safeId = safeObjectId(id)
  if (!safeId) {
    return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 })
  }

  // Get project (typed)
  const project = await Project.findById(safeId)

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }
  
  // Use helper method to check if project accepts votes
  if (!project.acceptsVotes()) {
    return NextResponse.json({ error: `Voting is not open for this project. Current status: ${project.status}` }, { status: 400 })
  }

  // ZIP rule
  if (!user?.zipcode || String(user.zipcode) !== String(project.zipcode)) {
    return NextResponse.json({ error: 'You must live in the project ZIP to vote' }, { status: 403 })
  }

  // One vote per user per project (use Mongoose model now)
  try {
    await ProjectVote.create({
      projectId: project._id,
      userId: session.user.id,
      zipcode: String(user.zipcode),
      value,
    })
  } catch (error: any) {
    if (error.code === 11000) { // Duplicate key error
      return NextResponse.json({ error: 'You already voted on this project' }, { status: 409 })
    }
    throw error
  }

  // Increment counters (typed return)
  const inc = value === 'yes' ? { votesYes: 1 } : { votesNo: 1 }
  const updated = await Project.findByIdAndUpdate(
    project._id,
    { $inc: inc },
    {
      new: true,
      projection: { votesYes: 1, votesNo: 1, voteGoal: 1, fundingGoal: 1, totalRaised: 1, status: 1 },
    }
  )

  if (!updated) {
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 })
  }

  // Check if project is ready for build phase (both goals met)
  if (updated.isReadyForBuild() && !updated.readyForBuildNotified) {
    // Mark as ready for admin notification
    await Project.findByIdAndUpdate(project._id, { 
      readyForBuildNotified: false  // This will trigger admin notification
    })
  }

  return NextResponse.json({
    ok: true,
    votesYes: updated?.votesYes ?? 0,
    votesNo: updated?.votesNo ?? 0,
  })
}
