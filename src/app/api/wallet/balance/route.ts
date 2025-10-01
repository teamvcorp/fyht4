// src/app/api/wallet/balance/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongoose'
import User from '@/models/User'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    await dbConnect()
    
    const user = await User.findById(session.user.id)
      .select('walletBalance lowBalanceThreshold autoRefillEnabled autoRefillAmount')
      .lean()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const balance = user.walletBalance || 0
    const threshold = user.lowBalanceThreshold || 1000 // $10 default
    const isLowBalance = balance < threshold

    return NextResponse.json({
      balance, // in cents
      balanceDollars: (balance / 100).toFixed(2),
      isLowBalance,
      threshold,
      autoRefillEnabled: user.autoRefillEnabled || false,
      autoRefillAmount: user.autoRefillAmount || 2500,
      suggestedTopUp: isLowBalance ? Math.max(2500, threshold * 2) : null
    })
    
  } catch (error: any) {
    console.error('Wallet balance error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch wallet balance' },
      { status: 500 }
    )
  }
}