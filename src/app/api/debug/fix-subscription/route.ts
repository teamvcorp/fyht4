import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import dbConnect from '@/lib/mongoose'
import User from '@/models/User'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.NEXT_AUTH_STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
})

export async function GET() {
  return await handleFixSubscription()
}

export async function POST() {
  return await handleFixSubscription()
}

async function handleFixSubscription() {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    await dbConnect()

    const user = await User.findById(session.user.id)
      .select('stripeCustomerId activeSubscription')
      .lean()

    if (!user?.activeSubscription?.id) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 })
    }

    // Fetch fresh subscription data from Stripe
    const stripeSub = await stripe.subscriptions.retrieve(user.activeSubscription.id)
    const currentPeriodEnd = (stripeSub as any).current_period_end || (stripeSub as any).currentPeriodEnd
    
    // Update the user with correct currentPeriodEnd
    const updatedUser = await User.findByIdAndUpdate(
      session.user.id,
      {
        $set: {
          'activeSubscription.currentPeriodEnd': new Date(currentPeriodEnd * 1000),
          'activeSubscription.status': stripeSub.status,
        }
      },
      { new: true, projection: { activeSubscription: 1 } }
    )

    const hasActiveSubscription = updatedUser?.activeSubscription ? 
      (updatedUser.activeSubscription.status === 'active' || updatedUser.activeSubscription.status === 'trialing') &&
      updatedUser.activeSubscription.interval === 'month' &&
      updatedUser.activeSubscription.currentPeriodEnd &&
      new Date(updatedUser.activeSubscription.currentPeriodEnd).getTime() > Date.now()
      : false

    return NextResponse.json({
      message: 'Subscription updated successfully',
      activeSubscription: updatedUser?.activeSubscription,
      hasActiveSubscription,
      stripeData: {
        id: stripeSub.id,
        status: stripeSub.status,
        current_period_end: currentPeriodEnd,
        current_period_end_date: new Date(currentPeriodEnd * 1000)
      }
    })
  } catch (error) {
    console.error('Fix subscription error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}