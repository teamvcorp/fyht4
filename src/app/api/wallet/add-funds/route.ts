// src/app/api/wallet/add-funds/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongoose'
import User from '@/models/User'
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
    
    const body = await req.json()
    const { amount, savePaymentMethod = true, returnUrl } = body // Default to true for auto-refill
    
    // Validate amount (minimum $25)
    const amountCents = Math.round(Number(amount) * 100)
    if (!Number.isFinite(amountCents) || amountCents < 2500) {
      return NextResponse.json({ 
        error: 'Invalid amount. Minimum wallet refill is $25.' 
      }, { status: 400 })
    }

    // Get or create Stripe customer
    const user = await User.findById(session.user.id)
      .select('email stripeCustomerId')
      .lean()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    let customerId = user.stripeCustomerId
    
    if (!customerId && user.email) {
      // Create Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: session.user.id }
      })
      customerId = customer.id
      
      // Update user with customer ID
      await User.findByIdAndUpdate(session.user.id, {
        stripeCustomerId: customerId
      })
    }

    if (!customerId) {
      return NextResponse.json({ 
        error: 'Unable to process payment. Please contact support.' 
      }, { status: 400 })
    }

    const url = new URL(req.url)
    const origin = req.headers.get('origin') || `${url.protocol}//${url.host}`
    const successUrl = returnUrl ? 
      `${origin}${returnUrl}?wallet_funded=true` : 
      `${origin}/settings?wallet_funded=true`
    const cancelUrl = `${origin}/settings?wallet_cancelled=true`

    // Create payment intent for wallet funding
    const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
      amount: amountCents,
      currency: 'usd',
      customer: customerId,
      metadata: {
        type: 'wallet_funding',
        userId: session.user.id,
        originalAmount: amountCents.toString()
      },
      description: `Wallet funding: $${(amountCents / 100).toFixed(2)}`
    }

    if (savePaymentMethod) {
      paymentIntentParams.setup_future_usage = 'off_session'
    }

    // For now, use checkout session for better UX
    const checkoutParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'payment',
      customer: customerId,
      line_items: [{
        price_data: {
          currency: 'usd',
          unit_amount: amountCents,
          product_data: {
            name: 'Wallet Funding',
            description: `Add $${(amountCents / 100).toFixed(2)} to your FYHT4 wallet`
          }
        },
        quantity: 1
      }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        type: 'wallet_funding',
        userId: session.user.id,
        amount: amountCents.toString()
      },
      payment_intent_data: {
        metadata: {
          type: 'wallet_funding',
          userId: session.user.id,
          amount: amountCents.toString()
        }
      }
    }

    if (savePaymentMethod) {
      checkoutParams.payment_intent_data = {
        ...checkoutParams.payment_intent_data,
        setup_future_usage: 'off_session'
      }
    }

    const checkoutSession = await stripe.checkout.sessions.create(checkoutParams)

    return NextResponse.json({ 
      url: checkoutSession.url,
      sessionId: checkoutSession.id
    })
    
  } catch (error: any) {
    console.error('Add funds error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create payment session' },
      { status: 500 }
    )
  }
}