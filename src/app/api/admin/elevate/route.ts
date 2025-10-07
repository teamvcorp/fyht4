// src/app/api/admin/elevate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongoose'
import User from '@/models/User'
import { checkRateLimit, rateLimiters } from '@/lib/rateLimit'
import { logAudit } from '@/lib/auditLog'
import crypto from 'crypto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Apply strict rate limiting (3 attempts per 15 minutes)
    const identifier = `admin-elevate:${session.user.id}`
    const rateLimitResult = checkRateLimit(identifier, rateLimiters.strict)
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!
    }

    await dbConnect()
    
    const body = await req.json()
    const { password } = body

    if (!password || typeof password !== 'string') {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 })
    }

    // Get the admin password from environment variables
    const adminPassword = process.env.ADMIN_ELEVATION_PASSWORD

    if (!adminPassword) {
      return NextResponse.json({ 
        error: 'Admin elevation not configured. Contact system administrator.' 
      }, { status: 500 })
    }

    // Timing-safe password comparison to prevent timing attacks
    const providedHash = crypto.createHash('sha256').update(password).digest()
    const correctHash = crypto.createHash('sha256').update(adminPassword).digest()
    
    // Add random delay (50-150ms) to further prevent timing analysis
    const randomDelay = 50 + Math.random() * 100
    await new Promise(resolve => setTimeout(resolve, randomDelay))
    
    let isPasswordValid = false
    try {
      // Convert Buffer to Uint8Array for timingSafeEqual
      const providedArray = new Uint8Array(providedHash)
      const correctArray = new Uint8Array(correctHash)
      isPasswordValid = crypto.timingSafeEqual(providedArray, correctArray)
    } catch (error) {
      isPasswordValid = false
    }
    
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid admin password' }, { status: 403 })
    }

    // Update user role to admin
    const updatedUser = await User.findByIdAndUpdate(
      session.user.id,
      { role: 'admin' },
      { new: true }
    )

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Log the elevation for security audit
    await logAudit({
      userId: session.user.id,
      userEmail: session.user.email || 'unknown',
      action: 'admin.elevate',
      resource: 'user',
      resourceId: session.user.id,
      req,
      status: 'success',
    })

    return NextResponse.json({
      success: true,
      message: 'Admin role granted successfully',
      role: 'admin',
      // Include a flag to force session refresh
      forceSessionRefresh: true
    })

  } catch (error: any) {
    console.error('Admin elevation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to elevate to admin' },
      { status: 500 }
    )
  }
}