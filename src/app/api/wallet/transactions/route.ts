// src/app/api/wallet/transactions/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongoose'
import WalletTransaction from '@/models/WalletTransaction'
import Project from '@/models/Project'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    await dbConnect()
    
    // Ensure models are registered
    if (!WalletTransaction) {
      throw new Error('WalletTransaction model not available')
    }
    
    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')))
    const skip = (page - 1) * limit

    const transactions = await WalletTransaction.find({ 
      userId: session.user.id,
      status: 'completed'
    })
    .populate('relatedProjectId', 'title status')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean()

    const total = await WalletTransaction.countDocuments({ 
      userId: session.user.id,
      status: 'completed'
    })

    const formattedTransactions = transactions.map(tx => ({
      id: tx._id,
      type: tx.type,
      amount: tx.amount,
      amountDollars: (tx.amount / 100).toFixed(2),
      description: tx.description,
      date: tx.createdAt,
      relatedProject: tx.relatedProjectId ? {
        id: (tx.relatedProjectId as any)._id,
        title: (tx.relatedProjectId as any).title,
        status: (tx.relatedProjectId as any).status
      } : null,
      balanceAfter: tx.balanceAfter,
      balanceAfterDollars: (tx.balanceAfter / 100).toFixed(2)
    }))

    return NextResponse.json({
      transactions: formattedTransactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total
      }
    })
    
  } catch (error: any) {
    console.error('Wallet transactions error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch wallet transactions' },
      { status: 500 }
    )
  }
}