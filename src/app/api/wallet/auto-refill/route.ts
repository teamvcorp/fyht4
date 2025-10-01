// src/app/api/wallet/auto-refill/route.ts
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
      .select('autoRefillEnabled autoRefillAmount lowBalanceThreshold stripePaymentMethodId')
      .lean()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      enabled: user.autoRefillEnabled || false,
      amount: user.autoRefillAmount || 2500, // $25 default
      threshold: user.lowBalanceThreshold || 1000, // $10 default
      hasPaymentMethod: !!user.stripePaymentMethodId,
      amountDollars: ((user.autoRefillAmount || 2500) / 100).toFixed(2),
      thresholdDollars: ((user.lowBalanceThreshold || 1000) / 100).toFixed(2)
    })
    
  } catch (error: any) {
    console.error('Auto-refill GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch auto-refill settings' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    await dbConnect()
    
    const body = await req.json()
    const { enabled, amount, threshold } = body
    
    // Validate amounts
    const amountCents = Math.round(Number(amount) * 100)
    const thresholdCents = Math.round(Number(threshold) * 100)
    
    if (enabled) {
      if (!Number.isFinite(amountCents) || amountCents < 2500) {
        return NextResponse.json({ 
          error: 'Auto-refill amount must be at least $25' 
        }, { status: 400 })
      }
      
      if (!Number.isFinite(thresholdCents) || thresholdCents < 100) {
        return NextResponse.json({ 
          error: 'Low balance threshold must be at least $1' 
        }, { status: 400 })
      }
      
      if (thresholdCents >= amountCents) {
        return NextResponse.json({ 
          error: 'Threshold must be less than refill amount' 
        }, { status: 400 })
      }
    }

    // Update user settings
    const updateData: any = {
      autoRefillEnabled: !!enabled,
      autoRefillAmount: enabled ? amountCents : 2500,
      lowBalanceThreshold: enabled ? thresholdCents : 1000
    }

    const updatedUser = await User.findByIdAndUpdate(
      session.user.id,
      { $set: updateData },
      { new: true }
    ).select('autoRefillEnabled autoRefillAmount lowBalanceThreshold')

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      enabled: updatedUser.autoRefillEnabled,
      amount: updatedUser.autoRefillAmount || 2500,
      threshold: updatedUser.lowBalanceThreshold || 1000,
      amountDollars: ((updatedUser.autoRefillAmount || 2500) / 100).toFixed(2),
      thresholdDollars: ((updatedUser.lowBalanceThreshold || 1000) / 100).toFixed(2)
    })
    
  } catch (error: any) {
    console.error('Auto-refill POST error:', error)
    return NextResponse.json(
      { error: 'Failed to update auto-refill settings' },
      { status: 500 }
    )
  }
}