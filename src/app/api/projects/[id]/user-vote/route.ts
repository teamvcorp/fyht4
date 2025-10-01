import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import mongoose from 'mongoose'
import dbConnect from '@/lib/mongoose'
import ProjectVote from '@/models/ProjectVote'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 })
    }

    await dbConnect()

    // Check if user has voted on this project
    const vote = await ProjectVote.findOne({
      projectId: new mongoose.Types.ObjectId(id),
      userId: new mongoose.Types.ObjectId(session.user.id)
    }).lean()

    return NextResponse.json({ 
      vote: vote ? {
        value: vote.value,
        createdAt: vote.createdAt
      } : null
    })
  } catch (error) {
    console.error('Error fetching user vote:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}