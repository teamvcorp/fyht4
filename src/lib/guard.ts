// src/lib/guard.ts
import { getServerSession } from 'next-auth'
import type { Session } from 'next-auth'
import { NextResponse } from 'next/server'
import dbConnect from '@/lib/mongoose'
import User from '@/models/User'

/** The minimal user shape we read for gating */
type ActiveSub = {
  status:
    | 'trialing'
    | 'active'
    | 'past_due'
    | 'canceled'
    | 'incomplete'
    | 'incomplete_expired'
    | 'unpaid'
  interval: 'day' | 'week' | 'month' | 'year' | null
  currentPeriodEnd: Date | null
}
type GuardUser = {
  role?: 'user' | 'admin'
  activeSubscription?: ActiveSub | null
}

export async function getSessionOrResponse(): Promise<Session | NextResponse> {
  const session = await getServerSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return session
}

export function isAdminEmail(email?: string | null): boolean {
  const list = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(s => s.trim().toLowerCase())
  return email ? list.includes(email.toLowerCase()) : false
}

export async function getAdminOrResponse(): Promise<Session | NextResponse> {
  const session = await getServerSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (session.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return session
}

function isMonthlyActive(user: GuardUser | null | undefined): boolean {
  if (user?.role === 'admin') return true // admins bypass
  const sub = user?.activeSubscription
  if (!sub) return false
  if (sub.interval !== 'month') return false
  const ok = new Set<ActiveSub['status']>(['trialing', 'active', 'past_due'])
  if (!ok.has(sub.status)) return false
  if (!sub.currentPeriodEnd) return false
  return new Date(sub.currentPeriodEnd).getTime() > Date.now()
}

/**
 * Ensures the caller is an active monthly subscriber (or admin).
 * Returns either a NextResponse (401/403) or the allowed { session, user }.
 */
export async function requireMonthlySubscriber(): Promise<
  NextResponse | { session: Session; user: GuardUser }
> {
  const session = await getServerSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await dbConnect()

  // 👇 Tell Mongoose the exact shape we want back
  const user = await User.findById(session.user.id)
    .select('role activeSubscription')
    .lean<GuardUser | null>()

  if (!user || !isMonthlyActive(user)) {
    return NextResponse.json(
      { error: 'You must be an active monthly subscriber to perform this action.' },
      { status: 403 },
    )
  }

  return { session, user }
}
