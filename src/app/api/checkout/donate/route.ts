// src/app/api/checkout/donate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import dbConnect from '@/lib/mongoose'
import User, { IUser } from '@/models/User'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const stripe = new Stripe(process.env.NEXT_AUTH_STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
})

export async function GET(req: NextRequest) {
  try {
    await dbConnect()

    // ── Auth/session (use this instead of passing userId via query) ──
    const session = await getServerSession(authOptions)
    const userIdFromSession = session?.user?.id || undefined

    const { searchParams } = new URL(req.url)
    const frequency = (searchParams.get('frequency') || 'once').toLowerCase()
    const isMonthly = frequency === 'monthly'
    const amount = Math.round(Number(searchParams.get('amount') || '0') * 100)
    if (!Number.isFinite(amount) || amount < 100) {
      return NextResponse.json({ error: 'Invalid amount. Minimum is $1.' }, { status: 400 })
    }

    const campaign = (searchParams.get('campaign') || '').trim()
    const emailFromQuery = searchParams.get('email') || undefined

    // URLs
    const url = new URL(req.url)
    const origin = req.headers.get('origin') || `${url.protocol}//${url.host}`
    const site = process.env.NEXT_PUBLIC_SITE_URL || origin
    const success_url = `${site}/thank-you?status=success`
    const cancel_url  = `${site}/payment-failure?reason=cancelled`

    // ── Reuse Stripe customer if the user already has one ──
    let customer: string | undefined
    let prefillEmail: string | undefined = emailFromQuery

    if (userIdFromSession) {
      // Force a lean, well-typed result (avoid Mongoose union weirdness)
      const user = await User.findById(userIdFromSession)
        .select('email stripeCustomerId')
        .lean<{ email?: string; stripeCustomerId?: string } | null>()

      if (user?.stripeCustomerId) {
        customer = user.stripeCustomerId
      } else if (user?.email) {
        prefillEmail = user.email
      }
    }

    // Single line item (donation or monthly membership)
    const lineItem: Stripe.Checkout.SessionCreateParams.LineItem = {
      quantity: 1,
      price_data: {
        currency: 'usd',
        unit_amount: amount,
        product_data: {
          name: isMonthly ? 'FYHT4 Monthly Membership' : 'FYHT4 Donation',
        },
        ...(isMonthly ? { recurring: { interval: 'month' } } : {}),
      },
    }

    // Metadata shared across session & (if subscription) the subscription itself
    const meta: Record<string, string> = { campaign, source: 'donate_page' }
    if (userIdFromSession) meta.userId = userIdFromSession

    const params: Stripe.Checkout.SessionCreateParams = {
      mode: isMonthly ? 'subscription' : 'payment',
      line_items: [lineItem],
      success_url,
      cancel_url,
      billing_address_collection: 'auto',
      ...(isMonthly ? {} : { submit_type: 'donate' }),
      metadata: meta,
      ...(userIdFromSession ? { client_reference_id: userIdFromSession } : {}), // helpful in webhook
      ...(customer ? { customer } : {}),
      ...(!customer && prefillEmail ? { customer_email: prefillEmail } : {}),
    }

    if (isMonthly) {
      // Ensure userId/campaign live on the subscription itself (webhook-friendly)
      ;(params as any).subscription_data = { metadata: meta }
    }

    const sessionResp = await stripe.checkout.sessions.create(params)
    return NextResponse.json({ url: sessionResp.url })
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
