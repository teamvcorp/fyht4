// app/api/stripe/webhook/route.ts
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import dbConnect from '@/lib/mongoose'
import User from '@/models/User'
import WalletTransaction from '@/models/WalletTransaction'
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
  const interval = price?.recurring?.interval ?? null
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

function readInvoiceSubscriptionId(inv: any): string | null {
  const raw =
    inv?.subscription ??
    inv?.subscriptionId ??
    inv?.subscription_id ??
    null
  if (!raw) return null
  return typeof raw === 'string' ? raw : raw?.id ?? null
}

/** Find (and optionally link) a user given several hints */
async function resolveUserId({
  metaUserId,
  customerId,
  email,
}: {
  metaUserId?: string
  customerId?: string | null
  email?: string | null
}): Promise<Types.ObjectId | null> {
  await dbConnect()

  // 1) If we already have a user with this customerId, use it.
  if (customerId) {
    const byCust = await User.findOne({ stripeCustomerId: customerId }).select('_id').lean<{ _id: Types.ObjectId } | null>()
    if (byCust?._id) return byCust._id
  }

  // 2) Prefer explicit user id from metadata/client_reference_id; also link stripeCustomerId.
  if (metaUserId) {
    const updated = await User.findByIdAndUpdate(
      metaUserId,
      customerId ? { $set: { stripeCustomerId: customerId } } : {},
      { new: true, projection: { _id: 1 }, lean: true }
    )
    if (updated?._id) return updated._id as Types.ObjectId
  }

  // 3) Fall back to email if present; also link stripeCustomerId.
  if (email) {
    const byEmail = await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      customerId ? { $set: { stripeCustomerId: customerId } } : {},
      { new: true, projection: { _id: 1 }, lean: true }
    )
    if (byEmail?._id) return byEmail._id as Types.ObjectId
  }

  return null
}

async function upsertUserFromSubscription(sub: Stripe.Subscription, session?: Stripe.Checkout.Session) {
  const snap = normalizeSubscription(sub)

  const metaUserId =
    (sub.metadata?.userId as string | undefined) ||
    (session?.client_reference_id as string | undefined)

  const emailFromSession = session?.customer_details?.email ?? null

  const userId = await resolveUserId({
    metaUserId,
    customerId: snap.customerId,
    email: emailFromSession,
  })
  if (!userId) {
    console.warn('[stripe webhook] No matching user for subscription')
    return
  }

  const shouldClear =
    sub.status === 'canceled' ||
    sub.status === 'incomplete_expired' ||
    sub.status === 'unpaid'

  await dbConnect()
  await User.updateOne(
    { _id: userId },
    {
      $set: {
        stripeCustomerId: snap.customerId,
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

/** Handle wallet funding when Stripe payment completes */
async function handleWalletFunding(userId: string, amount: number, paymentIntentId: string) {
  await dbConnect()
  
  // Get payment intent to check for payment method
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
  const paymentMethodId = typeof paymentIntent.payment_method === 'string' 
    ? paymentIntent.payment_method 
    : paymentIntent.payment_method?.id
  
  // Start database transaction for atomic operations
  const session = await User.startSession()
  
  try {
    await session.withTransaction(async () => {
      // Get current user balance
      const user = await User.findById(userId).select('walletBalance').session(session)
      if (!user) {
        throw new Error('User not found for wallet funding')
      }

      const currentBalance = user.walletBalance || 0
      const newBalance = currentBalance + amount

      // Update user wallet balance and save payment method for auto-refill
      const updateData: any = {
        $inc: { walletBalance: amount }
      }
      
      // Save payment method for future auto-refill if available
      if (paymentMethodId) {
        updateData.$set = { stripePaymentMethodId: paymentMethodId }
      }

      await User.findByIdAndUpdate(userId, updateData, { session })

      // Create wallet transaction record
      const walletTransaction = new WalletTransaction({
        userId,
        type: 'credit',
        amount,
        description: `Wallet funding via Stripe: $${(amount / 100).toFixed(2)}`,
        status: 'completed',
        stripePaymentIntentId: paymentIntentId,
        balanceBefore: currentBalance,
        balanceAfter: newBalance,
        metadata: {
          paymentMethod: 'stripe_checkout',
          paymentIntentId,
          paymentMethodSaved: !!paymentMethodId
        }
      })

      await walletTransaction.save({ session })
    })
  } finally {
    await session.endSession()
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
    await dbConnect()
    
    // Ensure models are registered
    if (!WalletTransaction || !User) {
      throw new Error('Required models not available')
    }
    
    switch (event.type) {
      /**
       * ————————————————————————————————————————————————————————————————
       * checkout.session.completed
       * - Link stripeCustomerId to the user
       * - If subscription checkout, pull Subscription and snapshot it
       * ————————————————————————————————————————————————————————————————
       */
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        const customerId =
          (typeof session.customer === 'string'
            ? session.customer
            : session.customer?.id) || null

        const metaUserId =
          (session.metadata?.userId as string | undefined) ||
          (session.client_reference_id as string | undefined)

        const email = session.customer_details?.email ?? null

        const userId = await resolveUserId({ metaUserId, customerId, email })

        // Handle wallet funding
        if (session.metadata?.type === 'wallet_funding' && userId) {
          const amount = parseInt(session.metadata.amount || '0')
          if (amount > 0) {
            await handleWalletFunding(userId.toString(), amount, session.payment_intent as string)
          }
        }

        // If it was a subscription checkout, snapshot now
        if (session.mode === 'subscription' && typeof session.subscription === 'string') {
          const sub = await stripe.subscriptions.retrieve(session.subscription, {
            expand: ['items.data.price.product', 'customer'],
          })
          await upsertUserFromSubscription(sub, session)
        } else if (userId && customerId) {
          // One-time payment checkout: still link customer & mark lastPaidAt now
          await dbConnect()
          await User.updateOne(
            { _id: userId },
            { $set: { stripeCustomerId: customerId, lastPaidAt: new Date() } }
          )
        }
        break
      }

      /**
       * Subscription lifecycle → keep activeSubscription in sync
       */
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        await upsertUserFromSubscription(sub)
        break
      }

      /**
       * Invoice paid (classic and alt names) → refresh lastPaidAt and snapshot
       */
      case 'invoice.payment_succeeded':
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId =
          (typeof invoice.customer === 'string'
            ? invoice.customer
            : invoice.customer?.id) || null
        if (!customerId) break

        await dbConnect()
        await User.updateOne(
          { stripeCustomerId: customerId },
          { $set: { lastPaidAt: new Date((invoice.created as number) * 1000) } }
        )

        const subId = readInvoiceSubscriptionId(invoice as any)
        if (subId) {
          const sub = await stripe.subscriptions.retrieve(subId, {
            expand: ['items.data.price.product', 'customer'],
          })
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
