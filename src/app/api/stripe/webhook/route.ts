// app/api/stripe/webhook/route.ts
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const stripe = new Stripe(process.env.NEXT_AUTH_STRIPE_SECRET_KEY!, { apiVersion: '2025-08-27.basil' })
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET! // from your Stripe Dashboard/CLI

// Helper: parse ObjectId safely
function asObjectId(id?: string | null) {
  if (!id) return undefined
  try {
    return new ObjectId(String(id))
  } catch {
    return undefined
  }
}

// Idempotency: store processed Stripe event IDs to avoid double-processing
async function alreadyProcessed(db: any, eventId: string) {
  const res = await db.collection('stripe_events').findOneAndUpdate(
    { _id: eventId },
    { $setOnInsert: { _id: eventId, at: new Date() } },
    { upsert: true, returnDocument: 'before' },
  )
  return !!res.value // if existed before, we already processed
}

async function recordDonation(opts: {
  db: any
  externalId: string            // e.g., payment_intent id or invoice id
  kind: 'one_time' | 'subscription'
  amount: number                // cents
  currency: string
  email?: string | null
  userId?: ObjectId
  projectId?: ObjectId
  checkoutSessionId?: string
  subscriptionId?: string
  invoiceId?: string
  occurredAt?: Date
}) {
  const {
    db, externalId, kind, amount, currency, email, userId, projectId,
    checkoutSessionId, subscriptionId, invoiceId, occurredAt,
  } = opts

  // Upsert donation by externalId (idempotent)
  await db.collection('donations').updateOne(
    { externalId },
    {
      $setOnInsert: {
        externalId,
        source: 'stripe',
        kind,
        amount,                // store cents as integer
        currency: currency.toLowerCase(),
        email: email || null,
        userId: userId || null,
        projectId: projectId || null,
        checkoutSessionId: checkoutSessionId || null,
        subscriptionId: subscriptionId || null,
        invoiceId: invoiceId || null,
        createdAt: occurredAt || new Date(),
      },
    },
    { upsert: true },
  )

  // Increment project total if applicable
  if (projectId && amount > 0) {
    await db.collection('projects').updateOne(
      { _id: projectId },
      { $inc: { totalRaised: amount } }, // ensure default 0 in your schema
    )
  }
}

export async function POST(req: Request) {
  const sig = req.headers.get('stripe-signature')
  if (!sig || !WEBHOOK_SECRET) {
    return new NextResponse('Missing signature or webhook secret', { status: 400 })
  }

  // Get the raw body for signature verification
  const rawBody = await req.text()
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, WEBHOOK_SECRET)
  } catch (err: any) {
    console.error('❌ Webhook signature verification failed:', err.message)
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 })
  }

  const db = (await clientPromise).db()

  // Ensure idempotency per event
  if (await alreadyProcessed(db, event.id)) {
    return NextResponse.json({ received: true, idempotent: true })
  }

  try {
    switch (event.type) {
      /**
       * One-time and initial subscription checkout completion.
       * For one-time: definitive payment.
       * For subscription: initial payment (may be $0 if trial).
       */
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const isSubscription = session.mode === 'subscription'
        const amount = session.amount_total ?? 0
        const currency = session.currency || 'usd'
        const email = session.customer_details?.email || session.customer_email || null
        const checkoutSessionId = session.id
        const subscriptionId = (session.subscription as string) || undefined
        const paymentIntentId = (session.payment_intent as string) || undefined
        const campaign = (session.metadata?.campaign || '').trim()
        const projectId = asObjectId(campaign)

        // Try to match user by email (optional)
        let userId: ObjectId | undefined
        if (email) {
          const user = await db.collection('users').findOne({ email }, { projection: { _id: 1 } })
          if (user?._id) userId = new ObjectId(user._id)
        }

        // If there was an actual charge here, record it now.
        if (!isSubscription && amount > 0 && paymentIntentId) {
          await recordDonation({
            db,
            externalId: paymentIntentId,
            kind: 'one_time',
            amount,
            currency,
            email,
            userId,
            projectId,
            checkoutSessionId,
            occurredAt: new Date(),
          })
        }

        // For subscriptions: store zero/initial? We prefer to count actual money on invoice.paid.
        // But if amount_total > 0, we can also record the initial payment here using the invoice id
        // from session (not always present). We'll rely on invoice.paid below for consistent accounting.

        break
      }

      /**
       * Subscription invoices (initial & renewals).
       * This is the canonical place to count subscription money.
       */
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice
        const amount = invoice.amount_paid ?? 0 // cents
        if (amount <= 0) break

        const currency = invoice.currency || 'usd'
        const email = invoice.customer_email || null
        const invoiceId = invoice.id
        const subscriptionId = (invoice.subscription as string) || undefined

        // campaign from subscription metadata (set during Checkout)
        let campaign = invoice.metadata?.campaign || ''
        if (!campaign && subscriptionId) {
          try {
            const sub = await stripe.subscriptions.retrieve(subscriptionId)
            campaign = sub.metadata?.campaign || ''
          } catch (e) {
            console.warn('Could not fetch subscription metadata for', subscriptionId)
          }
        }
        const projectId = asObjectId((campaign || '').trim())

        // Match user by email (optional)
        let userId: ObjectId | undefined
        if (email) {
          const user = await db.collection('users').findOne({ email }, { projection: { _id: 1 } })
          if (user?._id) userId = new ObjectId(user._id)
        }

        await recordDonation({
          db,
          externalId: invoiceId,         // idempotent on invoice id
          kind: 'subscription',
          amount,
          currency,
          email,
          userId,
          projectId,
          subscriptionId,
          invoiceId,
          occurredAt: new Date(invoice.created * 1000),
        })

        break
      }

      // Optional: If you ever skip Checkout and take direct payments:
      case 'payment_intent.succeeded': {
        // Not strictly needed for your Checkout flow, but safe to ignore.
        break
      }
case 'charge.refunded': {
  const charge = event.data.object as Stripe.Charge
  const refund = charge.refunds?.data?.[0]
  const amount = refund?.amount ?? charge.amount_refunded ?? 0
  if (amount <= 0) break

  // Find the original donation by externalId (payment_intent)
  const db = (await clientPromise).db()
  const pi = typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent?.id
  const donation = await db.collection('donations').findOne({ externalId: pi })
  if (donation?.projectId) {
    await db.collection('projects').updateOne({ _id: donation.projectId }, { $inc: { totalRaised: -amount } })
  }

  // You may also insert a negative "adjustment" donation record if you want a full audit trail
  break
}

      default:
        // Unhandled events are normal; just log.
        console.log('Unhandled event type:', event.type)
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error('Webhook handler error:', err)
    return new NextResponse('Webhook handler error', { status: 500 })
  }
}
