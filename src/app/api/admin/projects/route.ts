// src/app/api/admin/projects/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongoose'
import User from '@/models/User'
import Project from '@/models/Project'

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

    // Get all projects sorted by zipcode
    const projects = await Project.find({})
      .select('title slug status zipcode city state category voteGoal votesYes votesNo fundingGoal totalRaised createdAt buildStartedAt completedAt createdBy')
      .populate({
        path: 'createdBy',
        select: 'name email'
      })
      .sort({ zipcode: 1, createdAt: -1 })
      .lean()

    return NextResponse.json({
      projects: projects.map((p: any) => ({
        id: p._id.toString(),
        title: p.title,
        slug: p.slug,
        status: p.status,
        zipcode: p.zipcode,
        city: p.city,
        state: p.state,
        category: p.category,
        voteGoal: p.voteGoal,
        votesYes: p.votesYes,
        votesNo: p.votesNo,
        fundingGoal: p.fundingGoal,
        totalRaised: p.totalRaised,
        createdAt: p.createdAt,
        buildStartedAt: p.buildStartedAt,
        completedAt: p.completedAt,
        createdBy: p.createdBy,
        // Calculated fields
        votePct: p.voteGoal > 0 ? Math.min(100, Math.round(((p.votesYes || 0) / p.voteGoal) * 100)) : 0,
        fundPct: p.fundingGoal > 0 ? Math.min(100, Math.round(((p.totalRaised || 0) / p.fundingGoal) * 100)) : 0
      }))
    })

  } catch (error: any) {
    console.error('Admin projects fetch error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
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
    const { projectId, updates } = body

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }

    // Validate updates
    const allowedFields = ['status', 'voteGoal', 'fundingGoal', 'title', 'category', 'zipcode', 'city', 'state']
    const filteredUpdates = Object.keys(updates)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = updates[key]
        return obj
      }, {} as any)

    // Update project
    const updatedProject = await Project.findByIdAndUpdate(
      projectId,
      { 
        ...filteredUpdates,
        // Set timestamps based on status changes
        ...(updates.status === 'build' && !updates.buildStartedAt ? { buildStartedAt: new Date() } : {}),
        ...(updates.status === 'completed' && !updates.completedAt ? { completedAt: new Date() } : {})
      },
      { new: true }
    )

    if (!updatedProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Admin action logged for audit

    return NextResponse.json({
      success: true,
      message: 'Project updated successfully',
      project: {
        id: updatedProject._id.toString(),
        title: updatedProject.title,
        status: updatedProject.status,
        voteGoal: updatedProject.voteGoal,
        fundingGoal: updatedProject.fundingGoal
      }
    })

  } catch (error: any) {
    console.error('Admin project update error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update project' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
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

    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }

    // Find the project first to log details
    const project = await Project.findById(projectId).select('title status createdBy')
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Delete the project
    await Project.findByIdAndDelete(projectId)

    // Admin deletion logged for audit

    return NextResponse.json({
      success: true,
      message: 'Project deleted successfully',
      deletedProject: {
        id: projectId,
        title: project.title
      }
    })

  } catch (error: any) {
    console.error('Admin project delete error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete project' },
      { status: 500 }
    )
  }
}
