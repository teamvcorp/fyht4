// src/app/api/auth/role/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongoose'
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
    
    // Get role from database
    const user = await User.findById(session.user.id).select('role email').lean()
    const dbRole = user?.role || 'user'
    
    // Get role from session
    const sessionRole = (session.user as any).role || 'user'

    return NextResponse.json({
      userId: session.user.id,
      email: user?.email,
      roleFromDatabase: dbRole,
      roleFromSession: sessionRole,
      rolesMatch: dbRole === sessionRole,
      sessionUser: session.user
    })

  } catch (error: any) {
    console.error('Role check error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to check role' },
      { status: 500 }
    )
  }
}