// src/app/api/admin/notifications/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongoose'
import Project from '@/models/Project'
import User from '@/models/User'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    await dbConnect()
    
    // Check if user is admin
    const user = await User.findById(session.user.id).select('role')
    if (user?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get projects ready for build (vote and funding goals met, not yet notified)
    const readyForBuild = await Project.find({
      status: { $in: ['voting', 'funding'] },
      readyForBuildNotified: { $ne: true },
      $expr: {
        $and: [
          { $gte: ['$votesYes', '$voteGoal'] },
          { $gte: ['$totalRaised', '$fundingGoal'] },
          { $gt: ['$voteGoal', 0] },
          { $gt: ['$fundingGoal', 0] }
        ]
      }
    }).select('title status voteGoal votesYes fundingGoal totalRaised zipcode city state')

    // Get projects ready for completion (in build status, admin review needed)
    const readyForCompletion = await Project.find({
      status: 'build',
      buildStartedAt: { $exists: true },
      adminVerifiedComplete: false,
      readyForCompletionNotified: { $ne: true }
    }).select('title buildStartedAt zipcode city state')

    return NextResponse.json({
      readyForBuild: readyForBuild.map(p => ({
        id: p._id,
        title: p.title,
        status: p.status,
        location: `${p.city || 'Unknown'}, ${p.state || 'Unknown'} ${p.zipcode || ''}`.trim(),
        voteProgress: `${p.votesYes}/${p.voteGoal}`,
        fundingProgress: `$${((p.totalRaised || 0) / 100).toFixed(2)}/$${((p.fundingGoal || 0) / 100).toFixed(2)}`,
        votesMet: (p.votesYes || 0) >= (p.voteGoal || 0),
        fundingMet: (p.totalRaised || 0) >= (p.fundingGoal || 0)
      })),
      readyForCompletion: readyForCompletion.map(p => ({
        id: p._id,
        title: p.title,
        buildStartedAt: p.buildStartedAt,
        location: `${p.city || 'Unknown'}, ${p.state || 'Unknown'} ${p.zipcode || ''}`.trim(),
        daysSinceStart: p.buildStartedAt ? Math.floor((Date.now() - new Date(p.buildStartedAt).getTime()) / (1000 * 60 * 60 * 24)) : 0
      }))
    })

  } catch (error: any) {
    console.error('Admin notifications error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    await dbConnect()
    
    // Check if user is admin
    const user = await User.findById(session.user.id).select('role')
    if (user?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await req.json()
    const { projectId, action } = body

    const project = await Project.findById(projectId)
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    if (action === 'markBuildNotified') {
      await Project.findByIdAndUpdate(projectId, {
        readyForBuildNotified: true
      })
      return NextResponse.json({ success: true, message: 'Build notification marked as sent' })
    }

    if (action === 'moveToBuilding') {
      await Project.findByIdAndUpdate(projectId, {
        status: 'build',
        buildStartedAt: new Date(),
        readyForBuildNotified: true
      })
      return NextResponse.json({ success: true, message: 'Project moved to building phase' })
    }

    if (action === 'markCompletionNotified') {
      await Project.findByIdAndUpdate(projectId, {
        readyForCompletionNotified: true
      })
      return NextResponse.json({ success: true, message: 'Completion notification marked as sent' })
    }

    if (action === 'markCompleted') {
      await Project.findByIdAndUpdate(projectId, {
        status: 'completed',
        completedAt: new Date(),
        adminVerifiedComplete: true,
        readyForCompletionNotified: true
      })
      return NextResponse.json({ success: true, message: 'Project marked as completed' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error: any) {
    console.error('Admin notification action error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process action' },
      { status: 500 }
    )
  }
}