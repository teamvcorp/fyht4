// app/api/checkout/donate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongoose'
import User from '@/models/User'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const stripe = new Stripe(process.env.NEXT_AUTH_STRIPE_SECRET_KEY!, { apiVersion: '2025-08-27.basil' })

export async function GET(req: NextRequest) {
  try {
    const sessionAuth = await getServerSession(authOptions)
    const userId = sessionAuth?.user?.id || null

    const { searchParams } = new URL(req.url)
    const frequency = (searchParams.get('frequency') || 'once').toLowerCase()
    const isMonthly = frequency === 'monthly'
    const amount = Math.round(Number(searchParams.get('amount') || '0') * 100)
    if (!Number.isFinite(amount) || amount < 100) {
      return NextResponse.json({ error: 'Invalid amount. Minimum is $1.' }, { status: 400 })
    }

    const campaign = (searchParams.get('campaign') || '').trim()
    const emailQS = searchParams.get('email') || undefined

    const url = new URL(req.url)
    const origin = req.headers.get('origin') || `${url.protocol}//${url.host}`
    const site = process.env.NEXT_PUBLIC_SITE_URL || origin
    const success_url = `${site}/thank-you?status=success`
    const cancel_url = `${site}/donate?status=cancelled`

    // Try to reuse an existing Stripe customer if user is logged in
    let customer: string | undefined
    let customer_email: string | undefined = emailQS

    if (isMonthly && userId) {
      await dbConnect()
      const user = await User.findById(userId).select('email stripeCustomerId').lean()

      if (user?.stripeCustomerId) {
        customer = user.stripeCustomerId
      } else if (user?.email) {
        // Stripe will auto-dedupe customers on the same email in many cases
        customer_email = user.email
      }
    }

    const lineItem: Stripe.Checkout.SessionCreateParams.LineItem = {
      quantity: 1,
      price_data: {
        currency: 'usd',
        unit_amount: amount,
        product_data: {
          name: isMonthly ? 'FYHT4 Monthly Donation' : 'FYHT4 Donation',
        },
        ...(isMonthly ? { recurring: { interval: 'month' } } : {}),
      },
    }

    const params: Stripe.Checkout.SessionCreateParams = {
      mode: isMonthly ? 'subscription' : 'payment',
      line_items: [lineItem],
      success_url,
      cancel_url,
      billing_address_collection: 'auto',
      ...(isMonthly ? {} : { submit_type: 'donate' }),

      // Tag the session so webhooks can resolve the user/project later
      client_reference_id: userId || undefined,
      metadata: { campaign, source: 'donate_page', userId: userId || '' },

      ...(customer ? { customer } : {}),
      ...(customer_email ? { customer_email } : {}),
      // For subscriptions, carry userId/campaign on the subscription too
      ...(isMonthly
        ? {
            subscription_data: {
              metadata: { campaign, userId: userId || '' },
            },
          }
        : {}),
    }

    const session = await stripe.checkout.sessions.create(params)
    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    console.error('Checkout error:', {
      type: err?.type,
      code: err?.code,
      param: err?.param,
      requestId: err?.requestId ?? err?.raw?.requestId,
      message: err?.message,
      rawMessage: err?.raw?.message,
    })
    return NextResponse.json(
      { error: err?.raw?.message || err?.message || 'Unable to create checkout session' },
      { status: 500 }
    )
  }
}
