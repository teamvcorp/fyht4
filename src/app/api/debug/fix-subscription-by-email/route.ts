import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongoose'
import User from '@/models/User'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.NEXT_AUTH_STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
})

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const email = url.searchParams.get('email')
    
    if (!email) {
      return NextResponse.json({ error: 'Email parameter required' }, { status: 400 })
    }

    await dbConnect()

    const user = await User.findOne({ email: email.toLowerCase() })
      .select('email stripeCustomerId activeSubscription')
      .lean()

    if (!user?.activeSubscription?.id) {
      return NextResponse.json({ error: 'No active subscription found for this email' }, { status: 404 })
    }

    // Fetch fresh subscription data from Stripe
    const stripeSub = await stripe.subscriptions.retrieve(user.activeSubscription.id)
    
    // Get current_period_end from the subscription item (not the subscription itself)
    const firstItem = stripeSub.items?.data?.[0]
    const currentPeriodEnd = (firstItem as any)?.current_period_end || 
                            (stripeSub as any).current_period_end || 
                            (stripeSub as any).currentPeriodEnd
    
    console.log('Stripe subscription data:', {
      id: stripeSub.id,
      status: stripeSub.status,
      current_period_end: currentPeriodEnd,
      type: typeof currentPeriodEnd,
      from_item: (firstItem as any)?.current_period_end,
      from_sub: (stripeSub as any).current_period_end
    })
    
    if (!currentPeriodEnd || typeof currentPeriodEnd !== 'number') {
      return NextResponse.json({ 
        error: 'Invalid current_period_end from Stripe',
        stripeData: {
          id: stripeSub.id,
          status: stripeSub.status,
          current_period_end: currentPeriodEnd,
          firstItem: firstItem,
          rawData: JSON.stringify(stripeSub, null, 2)
        }
      }, { status: 400 })
    }
    
    const periodEndDate = new Date(currentPeriodEnd * 1000)
    
    // Update the user with correct currentPeriodEnd
    const updatedUser = await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      {
        $set: {
          'activeSubscription.currentPeriodEnd': periodEndDate,
          'activeSubscription.status': stripeSub.status,
        }
      },
      { new: true, projection: { activeSubscription: 1, email: 1 } }
    )

    const hasActiveSubscription = updatedUser?.activeSubscription ? 
      (updatedUser.activeSubscription.status === 'active' || updatedUser.activeSubscription.status === 'trialing') &&
      updatedUser.activeSubscription.interval === 'month' &&
      updatedUser.activeSubscription.currentPeriodEnd &&
      new Date(updatedUser.activeSubscription.currentPeriodEnd).getTime() > Date.now()
      : false

    return NextResponse.json({
      message: 'Subscription updated successfully',
      email: updatedUser?.email,
      activeSubscription: updatedUser?.activeSubscription,
      hasActiveSubscription,
      stripeData: {
        id: stripeSub.id,
        status: stripeSub.status,
        current_period_end: currentPeriodEnd,
        current_period_end_date: periodEndDate
      }
    })
  } catch (error) {
    console.error('Fix subscription by email error:', error)
    return NextResponse.json({ error: 'Server error', details: (error as Error).message }, { status: 500 })
  }
}