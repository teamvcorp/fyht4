// app/api/stripe/webhook/route.ts
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import dbConnect from '@/lib/mongoose'
import User, { IUser } from '@/models/User'
import type { Types } from 'mongoose'
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const stripe = new Stripe(process.env.NEXT_AUTH_STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
})
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!

/** Convert unix seconds to Date or null */
function toDateOrNull(ts?: number | null) {
  return ts ? new Date(ts * 1000) : null
}

/** Read a field that may be snake_case (classic) or camelCase (basil) */
function dual<T = any>(obj: any, snake: string, camel: string): T | null {
  if (!obj) return null
  if (obj[snake] !== undefined) return obj[snake] as T
  if (obj[camel] !== undefined) return obj[camel] as T
  return null
}

/** Get a value from price that may differ across API versions */
function readPriceBasics(price: any) {
  const unitAmount = price?.unit_amount ?? price?.unitAmount ?? null
  const currency = price?.currency ?? null
  const interval = price?.recurring?.interval ?? null // (same in both)
  const priceId = price?.id ?? null
  const productId =
    typeof price?.product === 'string'
      ? (price?.product as string)
      : price?.product?.id ?? null

  return { unitAmount, currency, interval, priceId, productId }
}

/** Normalize subscription core fields for our snapshot */
function normalizeSubscription(sub: Stripe.Subscription) {
  const currentPeriodEnd =
    dual<number>(sub as any, 'current_period_end', 'currentPeriodEnd') ?? null
  const cancelAtPeriodEnd =
    dual<boolean>(sub as any, 'cancel_at_period_end', 'cancelAtPeriodEnd') ?? false

  // first item’s price (typical 1-price subscriptions)
  const firstItem = (sub.items?.data?.[0] as any) || null
  const price = firstItem?.price || null
  const { unitAmount, currency, interval, priceId, productId } = readPriceBasics(price)

  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id

  return {
    customerId,
    status: sub.status,
    interval: (interval as 'day' | 'week' | 'month' | 'year' | null) ?? null,
    amount: unitAmount ?? null,
    currency: currency ?? null,
    currentPeriodEnd: toDateOrNull(currentPeriodEnd),
    cancelAtPeriodEnd: !!cancelAtPeriodEnd,
    priceId,
    productId,
  }
}

async function upsertUserFromSubscription(sub: Stripe.Subscription) {
  await dbConnect()
  const snap = normalizeSubscription(sub)

  // Single-doc shape for what we need
  type UserIdOnly = { _id: Types.ObjectId }

  // 🔧 Always get ONE doc here (findOne, not find)
  let user: UserIdOnly | null = await User
    .findOne({ stripeCustomerId: snap.customerId })
    .select('_id')
    .lean<UserIdOnly>()

  if (!user) {
    const metaUserId =
      (sub.metadata?.userId as string | undefined) ??
      (typeof (sub as any).metadata?.user_id === 'string' ? (sub as any).metadata.user_id : undefined)

    if (metaUserId) {
      // 🔧 Ensure this also returns ONE doc and typed as such
      user = await User.findByIdAndUpdate(
        metaUserId,
        { $set: { stripeCustomerId: snap.customerId } },
        { new: true, projection: { _id: 1 }, lean: true }
      ) as UserIdOnly | null
    }
  }

  if (!user?._id) return

  const shouldClear =
    sub.status === 'canceled' ||
    sub.status === 'incomplete_expired' ||
    sub.status === 'unpaid'

  await User.updateOne(
    { _id: user._id },
    {
      $set: {
        activeSubscription: shouldClear
          ? null
          : {
            id: sub.id,
            status: snap.status,
            interval: snap.interval,
            amount: snap.amount,
            currency: snap.currency,
            currentPeriodEnd: snap.currentPeriodEnd,
            cancelAtPeriodEnd: snap.cancelAtPeriodEnd,
            customerId: snap.customerId,
            priceId: snap.priceId,
            productId: snap.productId,
          },
      },
    }
  )
}
function readInvoiceSubscriptionId(inv: any): string | null {
  const raw =
    inv?.subscription ??
    inv?.subscriptionId ??
    inv?.subscription_id ??
    null
  if (!raw) return null
  return typeof raw === 'string' ? raw : raw?.id ?? null
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
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const customerId = typeof session.customer === 'string'
          ? session.customer
          : session.customer?.id

        // Prefer explicit user id from metadata or client_reference_id
        const metaUserId = (session.metadata?.userId as string | undefined)
          || (session.client_reference_id as string | undefined)

        if (customerId && metaUserId) {
          await dbConnect()
          await User.updateOne(
            { _id: metaUserId },
            { $set: { stripeCustomerId: customerId } }
          )
        }

        // If it's a subscription flow, you can still retrieve the subscription
        // and run your existing upsert/subscription snapshot logic afterward.
        // ...
        break
      }

      // After Checkout for subscriptions, prime activeSubscription
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode !== 'subscription') break
        const subId = (session.subscription as string) || undefined
        if (!subId) break

        const sub = await stripe.subscriptions.retrieve(subId)
        await upsertUserFromSubscription(sub)
        break
      }

      // Keep user snapshot in sync with subscription lifecycle
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        await upsertUserFromSubscription(sub)
        break
      }

      // Mark lastPaidAt and refresh current period on payment
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId =
          typeof invoice.customer === 'string'
            ? invoice.customer
            : invoice.customer?.id
        if (!customerId) break

        await dbConnect()

        await User.findOneAndUpdate(
          { stripeCustomerId: customerId },
          { $set: { lastPaidAt: new Date((invoice.created as number) * 1000) } }
        )

        // Refresh subscription snapshot if invoice ties to a subscription
        const subId = readInvoiceSubscriptionId(invoice as any)
        if (subId) {
          const sub = await stripe.subscriptions.retrieve(subId)
          await upsertUserFromSubscription(sub)
        }
        break
      }

      default:
        // Ignore other events
        break
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('Webhook handler error:', err)
    return new NextResponse('Webhook handler error', { status: 500 })
  }
}
