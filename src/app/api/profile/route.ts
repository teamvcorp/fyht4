import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbconnect from '@/lib/mongoose'
import UserModel from '@/models/User'

export const runtime = 'nodejs'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await dbconnect()
  const user = await UserModel.findById(session.user.id)
    .select('name email zipcode activeSubscription stripeCustomerId')
    .lean()
  
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Check if user has active subscription
  const hasActiveSubscription = Boolean(user.activeSubscription && 
    ['active', 'trialing'].includes(user.activeSubscription.status))

  return NextResponse.json({ 
    user: {
      ...user,
      hasActiveSubscription
    }
  })
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const { name, zipcode } = body as { name?: string; zipcode?: string }

  if (zipcode && !/^\d{5}(-\d{4})?$/.test(zipcode)) {
    return NextResponse.json({ error: 'Invalid ZIP' }, { status: 400 })
  }

  await dbconnect()
  await UserModel.findByIdAndUpdate(
    session.user.id,
    { 
      ...(name ? { name } : {}), 
      ...(zipcode !== undefined ? { zipcode: String(zipcode) } : {}) 
    }
  )

  return NextResponse.json({ ok: true })
}
