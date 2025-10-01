import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import dbConnect from '@/lib/mongoose'
import User from '@/models/User'

export async function POST() {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    await dbConnect()

    // Get fresh user data
    const user = await User.findById(session.user.id)
      .select('email role stripeCustomerId activeSubscription')
      .lean()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const hasActiveSubscription = user.activeSubscription ? 
      (user.activeSubscription.status === 'active' || user.activeSubscription.status === 'trialing') &&
      user.activeSubscription.interval === 'month' &&
      user.activeSubscription.currentPeriodEnd &&
      new Date(user.activeSubscription.currentPeriodEnd).getTime() > Date.now()
      : false

    return NextResponse.json({
      message: 'Session data refreshed',
      userId: session.user.id,
      email: user.email,
      role: user.role,
      stripeCustomerId: user.stripeCustomerId,
      activeSubscription: user.activeSubscription,
      hasActiveSubscription,
      sessionIsSubscriber: (session.user as any).isSubscriber
    })
  } catch (error) {
    console.error('Refresh session error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}