// app/api/stripe/webhook/route.ts
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import dbConnect from '@/lib/mongoose'
import User from '@/models/User'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const stripe = new Stripe(process.env.NEXT_AUTH_STRIPE_SECRET_KEY!, { apiVersion: '2025-08-27.basil' })
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!

function toDateOrNull(ts?: number | null) {
  return ts ? new Date(ts * 1000) : null
}

async function upsertUserFromSubscription(sub: Stripe.Subscription) {
  await dbConnect()

  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id
  const price = sub.items.data[0]?.price
  const interval = price?.recurring?.interval ?? null
  const amount = price?.unit_amount ?? null
  const currency = price?.currency ?? null

  const snapshot = {
    id: sub.id,
    status: sub.status,
    interval: (interval as 'month' | 'year' | null) ?? null,
    amount: amount ?? null,
    currency: currency ?? null,
    currentPeriodEnd: toDateOrNull(sub.current_period_end),
    cancelAtPeriodEnd: !!sub.cancel_at_period_end,
    customerId,
    priceId: price?.id ?? null,
    productId:
      typeof price?.product === 'string'
        ? (price?.product as string)
        : (price?.product as any)?.id ?? null,
  }

  // Prefer matching by customerId; if not found and userId metadata present, update that user.
  let user = await User.findOne({ stripeCustomerId: customerId }).select('_id').lean()
  if (!user) {
    const metaUserId = (sub.metadata?.userId as string) || undefined
    if (metaUserId) {
      user = await User.findByIdAndUpdate(
        metaUserId,
        { $set: { stripeCustomerId: customerId } },
        { new: true, lean: true }
      )
    }
  }

  if (user) {
    // Set/clear activeSubscription by status
    const clear =
      sub.status === 'canceled' || sub.status === 'incomplete_expired' || sub.status === 'unpaid'
    await User.updateOne(
      { _id: user._id },
      { $set: { activeSubscription: clear ? null : snapshot } }
    )
  }
}

export async function POST(req: Request) {
  const sig = req.headers.get('stripe-signature')
  if (!sig || !WEBHOOK_SECRET) {
    return new NextResponse('Missing signature or webhook secret', { status: 400 })
  }

  const raw = await req.text()
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(raw, sig, WEBHOOK_SECRET)
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 })
  }

  try {
    switch (event.type) {
      // When Checkout completes for subscriptions, capture user/customer and prime activeSubscription
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode !== 'subscription') break

        const subId = (session.subscription as string) || undefined
        if (!subId) break

        const sub = await stripe.subscriptions.retrieve(subId)
        await upsertUserFromSubscription(sub)
        break
      }

      // Keep subscription snapshot in sync (status/period changes)
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        await upsertUserFromSubscription(sub)
        break
      }

      // Set lastPaidAt and ensure currentPeriodEnd is fresh
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId =
          typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id
        if (!customerId) break

        await dbConnect()
        // Stamp lastPaidAt
        await User.findOneAndUpdate(
          { stripeCustomerId: customerId },
          { $set: { lastPaidAt: new Date(invoice.created * 1000) } }
        )

        // If this invoice has a subscription, refresh the current period end
        if (invoice.subscription) {
          const subId =
            typeof invoice.subscription === 'string'
              ? invoice.subscription
              : invoice.subscription.id
          const sub = await stripe.subscriptions.retrieve(subId)
          await upsertUserFromSubscription(sub)
        }
        break
      }

      default:
        // ok to ignore others
        break
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('Webhook handler error:', err)
    return new NextResponse('Webhook handler error', { status: 500 })
  }
}
