import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import dbConnect from '@/lib/mongoose'
import User from '@/models/User'

export async function GET(req: NextRequest) {
  try {
    await dbConnect()

    // Check if email provided as query param for debugging
    const url = new URL(req.url)
    const email = url.searchParams.get('email')

    let user
    if (email) {
      // Debug by email
      user = await User.findOne({ email })
        .select('email role stripeCustomerId activeSubscription lastPaidAt')
        .lean()
    } else {
      // Normal session check
      const session = await getServerSession()
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
      }

      user = await User.findById(session.user.id)
        .select('email role stripeCustomerId activeSubscription lastPaidAt')
        .lean()
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      userId: user._id,
      email: user?.email,
      role: user?.role,
      stripeCustomerId: user?.stripeCustomerId,
      activeSubscription: user?.activeSubscription,
      lastPaidAt: user?.lastPaidAt,
      hasActiveSubscription: user?.activeSubscription ? 
        (user.activeSubscription.status === 'active' || user.activeSubscription.status === 'trialing') &&
        user.activeSubscription.interval === 'month' &&
        user.activeSubscription.currentPeriodEnd &&
        new Date(user.activeSubscription.currentPeriodEnd).getTime() > Date.now()
        : false
    })
  } catch (error) {
    console.error('Debug user error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}