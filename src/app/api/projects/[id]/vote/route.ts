// src/app/api/projects/[id]/vote/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import mongoose, {Types} from 'mongoose'
import dbConnect from '@/lib/mongoose'
import UserModel, { IUser } from '@/models/User'
import Project, { IProject } from '@/models/Project'
import ProjectVote from '@/models/ProjectVote'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> } // <-- params is a Promise in Next 15
) {
  const { id } = await params

  // Get session first
  const session = await getServerSession(authOptions)
  console.log('Vote API - Session check:', {
    hasSession: !!session,
    userId: session?.user?.id,
    email: session?.user?.email
  })
  
  if (!session?.user?.id) {
    console.log('Vote API - No session found, returning 401')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Do a real-time database check for subscription status (bypass JWT cache)
  await dbConnect()
  const user = await UserModel.findById(session.user.id)
    .select('role activeSubscription zipcode')
    .lean<Pick<IUser, '_id' | 'role' | 'activeSubscription' | 'zipcode'> | null>()

  console.log('Vote API - User lookup:', {
    userId: session.user.id,
    foundUser: !!user,
    userRole: user?.role,
    hasActiveSubscription: user?.activeSubscription?.status
  })

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

  console.log('Vote API - Subscription check:', {
    hasActiveSubscription,
    isAdmin,
    subscriptionStatus: user.activeSubscription?.status,
    subscriptionInterval: user.activeSubscription?.interval,
    currentPeriodEnd: user.activeSubscription?.currentPeriodEnd
  })

  if (!isAdmin && !hasActiveSubscription) {
    console.log('Vote API - Access denied, no active subscription')
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

  // Get project (typed)
  const project = mongoose.Types.ObjectId.isValid(id)
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
