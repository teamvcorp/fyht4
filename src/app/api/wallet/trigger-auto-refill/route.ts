// src/app/api/wallet/trigger-auto-refill/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongoose'
import User from '@/models/User'
import WalletTransaction from '@/models/WalletTransaction'
import Stripe from 'stripe'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const stripe = new Stripe(process.env.NEXT_AUTH_STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    await dbConnect()
    
    // Ensure models are registered
    if (!WalletTransaction || !User) {
      throw new Error('Required models not available')
    }
    
    const user = await User.findById(session.user.id)
      .select('walletBalance autoRefillEnabled autoRefillAmount lowBalanceThreshold stripeCustomerId stripePaymentMethodId')

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if auto-refill is enabled and conditions are met
    if (!user.autoRefillEnabled) {
      return NextResponse.json({ error: 'Auto-refill is not enabled' }, { status: 400 })
    }

    if (!user.stripeCustomerId || !user.stripePaymentMethodId) {
      return NextResponse.json({ 
        error: 'No payment method found. Please add funds manually to set up auto-refill.' 
      }, { status: 400 })
    }

    const currentBalance = user.walletBalance || 0
    const threshold = user.lowBalanceThreshold || 1000
    const refillAmount = user.autoRefillAmount || 2500

    if (currentBalance >= threshold) {
      return NextResponse.json({ 
        message: 'Balance is above threshold, no refill needed',
        currentBalance,
        threshold
      })
    }

    // Create payment intent for auto-refill
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: refillAmount,
        currency: 'usd',
        customer: user.stripeCustomerId,
        payment_method: user.stripePaymentMethodId,
        confirm: true,
        return_url: `${process.env.NEXTAUTH_URL}/settings?auto_refill=success`,
        metadata: {
          type: 'wallet_auto_refill',
          userId: session.user.id,
          amount: refillAmount.toString(),
          triggeredAt: new Date().toISOString()
        },
        description: `Auto-refill wallet: $${(refillAmount / 100).toFixed(2)}`
      })

      if (paymentIntent.status === 'succeeded') {
        // Process the refill immediately
        await processAutoRefill(session.user.id, refillAmount, paymentIntent.id)
        
        return NextResponse.json({
          success: true,
          message: `Successfully auto-refilled $${(refillAmount / 100).toFixed(2)}`,
          newBalance: currentBalance + refillAmount,
          paymentIntentId: paymentIntent.id
        })
      } else {
        return NextResponse.json({ 
          error: 'Auto-refill payment requires additional action',
          paymentIntentId: paymentIntent.id,
          status: paymentIntent.status
        }, { status: 402 })
      }

    } catch (stripeError: any) {
      console.error('Stripe auto-refill error:', stripeError)
      return NextResponse.json({ 
        error: `Auto-refill failed: ${stripeError.message}` 
      }, { status: 402 })
    }
    
  } catch (error: any) {
    console.error('Auto-refill trigger error:', error)
    return NextResponse.json(
      { error: 'Failed to trigger auto-refill' },
      { status: 500 }
    )
  }
}

async function processAutoRefill(userId: string, amount: number, paymentIntentId: string) {
  const session = await User.startSession()
  
  try {
    await session.withTransaction(async () => {
      // Get current user balance
      const user = await User.findById(userId).select('walletBalance').session(session)
      if (!user) {
        throw new Error('User not found for auto-refill')
      }

      const currentBalance = user.walletBalance || 0
      const newBalance = currentBalance + amount

      // Update user wallet balance
      await User.findByIdAndUpdate(
        userId,
        { $inc: { walletBalance: amount } },
        { session }
      )

      // Create wallet transaction record
      const walletTransaction = new WalletTransaction({
        userId,
        type: 'credit',
        amount,
        description: `Auto-refill: $${(amount / 100).toFixed(2)}`,
        status: 'completed',
        stripePaymentIntentId: paymentIntentId,
        balanceBefore: currentBalance,
        balanceAfter: newBalance,
        metadata: {
          paymentMethod: 'auto_refill',
          paymentIntentId
        }
      })

      await walletTransaction.save({ session })
    })
  } finally {
    await session.endSession()
  }
}