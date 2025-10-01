// src/app/api/admin/refresh-session/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongoose'
import User from '@/models/User'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    await dbConnect()
    
    // Get current role from database
    const user = await User.findById(session.user.id).select('role').lean()
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user is admin in database
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin role required' }, { status: 403 })
    }

    // Return success - the session will be refreshed on next request due to our auth config
    return NextResponse.json({
      success: true,
      role: user.role,
      message: 'Session will be refreshed with admin role'
    })

  } catch (error: any) {
    console.error('Session refresh error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to refresh session' },
      { status: 500 }
    )
  }
}