// app/api/checkout/donate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// (You can omit apiVersion to use Stripe's default, or ensure this string is valid)
const stripe = new Stripe(process.env.NEXT_AUTH_STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
})

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)

    const frequency = (searchParams.get('frequency') || 'once').toLowerCase()
    const isMonthly = frequency === 'monthly'
    const amount = Math.round(Number(searchParams.get('amount') || '0') * 100)
    if (!Number.isFinite(amount) || amount < 100) {
      return NextResponse.json({ error: 'Invalid amount. Minimum is $1.' }, { status: 400 })
    }

    // ★ ADDED: campaign + optional email
    const campaign = (searchParams.get('campaign') || '').trim()
    const email = searchParams.get('email') || undefined

    const url = new URL(req.url)
    const origin = req.headers.get('origin') || `${url.protocol}//${url.host}`
    const site = process.env.NEXT_PUBLIC_SITE_URL || origin
    const success_url = `${site}/thank-you?status=success`
    const cancel_url  = `${site}/donate?status=cancelled`

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
      // ★ ADDED: session-level metadata (helps attribute one-time donations)
      metadata: { campaign, source: 'donate_page' },
      // ★ ADDED: optional prefill email (nice DX but not required)
      ...(email ? { customer_email: email } : {}),
    }

    // ★ ADDED: for subscriptions, also set subscription_data.metadata
    if (isMonthly) {
      ;(params as any).subscription_data = {
        metadata: { campaign },
      }
    }

    // ONLY pass options if using Connect (you said you're not)
    const connectAccountId = searchParams.get('connectAccountId') || undefined
    const options = connectAccountId
      ? ({ stripeAccount: connectAccountId } as Stripe.RequestOptions)
      : undefined

    const session = options
      ? await stripe.checkout.sessions.create(params, options)
      : await stripe.checkout.sessions.create(params)

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
