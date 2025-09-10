import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'
import dbConnect from '@/lib/mongoose'
import User from '@/models/User'

export async function getSessionOrResponse() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return session
}

export function isAdminEmail(email?: string | null) {
  const list = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(Boolean)
  return email ? list.includes(email.toLowerCase()) : false
}

export async function getAdminOrResponse() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (session.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return session
}
function isMonthlyActive(user: { role?: string; activeSubscription?: any | null }): boolean {
  if (user?.role === 'admin') return true // admins bypass
  const sub = user?.activeSubscription
  if (!sub) return false
  if (sub.interval !== 'month') return false
  const okStatuses = new Set(['trialing', 'active', 'past_due']) // tweak if you want to exclude past_due
  if (!okStatuses.has(sub.status)) return false
  if (!sub.currentPeriodEnd) return false
  return new Date(sub.currentPeriodEnd).getTime() > Date.now()
}

export async function requireMonthlySubscriber() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await dbConnect()
  const user = await User.findById(session.user.id).select('role activeSubscription').lean()

  if (!user || !isMonthlyActive(user)) {
    return NextResponse.json(
      { error: 'You must be an active monthly subscriber to perform this action.' },
      { status: 403 }
    )
  }

  return { session, user }
}