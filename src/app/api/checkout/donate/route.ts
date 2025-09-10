// src/app/api/checkout/donate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import dbConnect from '@/lib/mongoose'
import User, { IUser } from '@/models/User'   // ⬅️ ensure this exports IUser

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const stripe = new Stripe(process.env.NEXT_AUTH_STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
})

export async function GET(req: NextRequest) {
  try {
    await dbConnect()

    const { searchParams } = new URL(req.url)
    const frequency = (searchParams.get('frequency') || 'once').toLowerCase()
    const isMonthly = frequency === 'monthly'
    const amount = Math.round(Number(searchParams.get('amount') || '0') * 100)
    if (!Number.isFinite(amount) || amount < 100) {
      return NextResponse.json({ error: 'Invalid amount. Minimum is $1.' }, { status: 400 })
    }

    const campaign = (searchParams.get('campaign') || '').trim()
    // optional prefill email from query (kept for parity)
    const emailFromQuery = searchParams.get('email') || undefined

    // ——— site URLs ———
    const url = new URL(req.url)
    const origin = req.headers.get('origin') || `${url.protocol}//${url.host}`
    const site = process.env.NEXT_PUBLIC_SITE_URL || origin
    const success_url = `${site}/thank-you?status=success`
    const cancel_url  = `${site}/donate?status=cancelled`

    // ——— Try to find a logged-in user and reuse Stripe customer ———
    // If you have access to the session here, you can pass a userId into this route,
    // or read it another way. If not, this block is just a safe optional enhancement.
    let customer: string | undefined
    let prefillEmail: string | undefined = emailFromQuery

    // If you already put userId in the query, you can read it:
    const userId = searchParams.get('userId') || undefined

    if (userId) {
      type UserLean = Pick<IUser, 'email' | 'stripeCustomerId'>
      const user = await User.findById(userId)
        .select('email stripeCustomerId')
        .lean<UserLean | null>()

      if (user?.stripeCustomerId) {
        customer = user.stripeCustomerId
      } else if (user?.email) {
        prefillEmail = user.email
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
      metadata: { campaign, source: 'donate_page' },
      ...(customer ? { customer } : {}),
      ...(!customer && prefillEmail ? { customer_email: prefillEmail } : {}),
    }

    if (isMonthly) {
      // Attach campaign to the subscription itself for reliable attribution later
      ;(params as any).subscription_data = {
        metadata: { campaign },
      }
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
