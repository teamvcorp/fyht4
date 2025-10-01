import { NextResponse } from 'next/server'
import dbConnect from '@/lib/mongoose'
import User from '@/models/User'

export async function GET() {
  try {
    await dbConnect()

    // Get the most recent 5 users with their subscription status
    const users = await User.find({})
      .select('email role stripeCustomerId activeSubscription lastPaidAt createdAt')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean()

    const usersWithStatus = users.map(user => ({
      email: user.email,
      role: user.role,
      stripeCustomerId: user.stripeCustomerId,
      activeSubscription: user.activeSubscription,
      lastPaidAt: user.lastPaidAt,
      createdAt: user.createdAt,
      hasActiveSubscription: user.activeSubscription ? 
        (user.activeSubscription.status === 'active' || user.activeSubscription.status === 'trialing') &&
        user.activeSubscription.interval === 'month' &&
        user.activeSubscription.currentPeriodEnd &&
        new Date(user.activeSubscription.currentPeriodEnd).getTime() > Date.now()
        : false
    }))

    return NextResponse.json({ users: usersWithStatus })
  } catch (error) {
    console.error('Debug users error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}