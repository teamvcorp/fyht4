// src/app/api/admin/projects/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongoose'
import User from '@/models/User'
import Project from '@/models/Project'
import { sanitizeInput } from '@/lib/sanitize'
import { safeObjectId } from '@/lib/mongoSafe'
import { validateZipcode, validateFundingGoal, validateVoteGoal } from '@/lib/validation'
import { checkRateLimit, rateLimiters } from '@/lib/rateLimit'
import { logAudit } from '@/lib/auditLog'

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
      .select('title slug status zipcode city state category shortDescription description voteGoal votesYes votesNo fundingGoal totalRaised createdAt buildStartedAt completedAt createdBy')
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
        shortDescription: p.shortDescription,
        description: p.description,
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

    // Rate limit admin updates (moderate)
    const identifier = `admin-project-update:${session.user.id}`
    const rateLimitResult = checkRateLimit(identifier, rateLimiters.moderate)
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!
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

    // Safely convert projectId to ObjectId
    const safeId = safeObjectId(projectId)
    if (!safeId) {
      return NextResponse.json({ error: 'Invalid project ID format' }, { status: 400 })
    }

    // Validate and sanitize updates
    const allowedFields = ['status', 'voteGoal', 'fundingGoal', 'title', 'category', 'zipcode', 'city', 'state', 'shortDescription', 'description']
    const filteredUpdates: any = {}

    for (const [key, value] of Object.entries(updates)) {
      if (!allowedFields.includes(key)) continue

      // Sanitize string fields
      if (key === 'title' || key === 'category' || key === 'city' || key === 'state' || key === 'shortDescription' || key === 'description') {
        filteredUpdates[key] = sanitizeInput(String(value))
      }
      // Validate zipcode
      else if (key === 'zipcode') {
        const zipStr = String(value)
        if (!validateZipcode(zipStr)) {
          return NextResponse.json({ error: 'Invalid zipcode format' }, { status: 400 })
        }
        filteredUpdates[key] = zipStr
      }
      // Validate fundingGoal
      else if (key === 'fundingGoal') {
        const amount = Number(value)
        const validation = validateFundingGoal(amount)
        if (!validation.valid) {
          return NextResponse.json({ error: validation.error }, { status: 400 })
        }
        filteredUpdates[key] = amount
      }
      // Validate voteGoal
      else if (key === 'voteGoal') {
        const votes = Number(value)
        const validation = validateVoteGoal(votes)
        if (!validation.valid) {
          return NextResponse.json({ error: validation.error }, { status: 400 })
        }
        filteredUpdates[key] = votes
      }
      // Validate status
      else if (key === 'status') {
        const validStatuses = ['draft', 'voting', 'funding', 'build', 'completed', 'archived']
        if (!validStatuses.includes(String(value))) {
          return NextResponse.json({ error: 'Invalid status value' }, { status: 400 })
        }
        filteredUpdates[key] = String(value)
      }
    }

    // Update project
    const updatedProject = await Project.findByIdAndUpdate(
      safeId,
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

    // Log admin action for audit trail
    await logAudit({
      userId: session.user.id,
      userEmail: session.user.email || 'unknown',
      action: 'admin.project.update',
      resource: 'project',
      resourceId: projectId,
      changes: filteredUpdates,
      req,
      status: 'success',
    })

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

    // Rate limit admin deletions (strict)
    const identifier = `admin-project-delete:${session.user.id}`
    const rateLimitResult = checkRateLimit(identifier, rateLimiters.strict)
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!
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

    // Safely convert projectId to ObjectId
    const safeId = safeObjectId(projectId)
    if (!safeId) {
      return NextResponse.json({ error: 'Invalid project ID format' }, { status: 400 })
    }

    // Find the project first to log details
    const project = await Project.findById(safeId).select('title status createdBy')
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Delete the project
    await Project.findByIdAndDelete(safeId)

    // Log admin deletion for audit trail
    await logAudit({
      userId: session.user.id,
      userEmail: session.user.email || 'unknown',
      action: 'admin.project.delete',
      resource: 'project',
      resourceId: projectId,
      changes: {
        title: project.title,
        status: project.status,
      },
      req,
      status: 'success',
    })

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
