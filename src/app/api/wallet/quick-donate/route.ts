// src/app/api/wallet/quick-donate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongoose'
import User from '@/models/User'
import Project from '@/models/Project'
import Donation from '@/models/Donation'
import WalletTransaction from '@/models/WalletTransaction'
import { nanoid } from 'nanoid'
import { checkRateLimit, rateLimiters } from '@/lib/rateLimit'
import { safeObjectId } from '@/lib/mongoSafe'
import { validateDonationAmount } from '@/lib/validation'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Rate limit wallet donations (moderate: 20/hour)
    const identifier = `wallet-donate:${session.user.id}`
    const rateLimitResult = checkRateLimit(identifier, rateLimiters.moderate)
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!
    }

    await dbConnect()
    
    // Ensure models are registered
    if (!WalletTransaction || !Project || !User || !Donation) {
      throw new Error('Required models not available')
    }
    
    const body = await req.json()
    const { projectId, amount } = body
    
    // Safely convert projectId to ObjectId
    const safeId = safeObjectId(projectId)
    if (!safeId) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 })
    }
    
    // Validate amount
    const amountDollars = Number(amount)
    const validation = validateDonationAmount(amountDollars)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }
    
    const amountCents = Math.round(amountDollars * 100)

    // Validate project exists and accepts donations
    const project = await Project.findById(safeId)
      .select('title status zipcode')

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Use the helper method to check if project accepts donations
    if (!project.acceptsDonations()) {
      return NextResponse.json({ 
        error: `This project is not currently accepting donations. Status: ${project.status}` 
      }, { status: 400 })
    }

    // Get user's current wallet balance
    const user = await User.findById(session.user.id)
      .select('walletBalance email')

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const currentBalance = user.walletBalance || 0
    
    if (currentBalance < amountCents) {
      // Check if auto-refill is enabled and can be triggered
      const autoRefillUser = await User.findById(session.user.id)
        .select('autoRefillEnabled autoRefillAmount lowBalanceThreshold stripeCustomerId stripePaymentMethodId')
      
      if (autoRefillUser?.autoRefillEnabled && 
          autoRefillUser.stripeCustomerId && 
          autoRefillUser.stripePaymentMethodId) {
        
        return NextResponse.json({ 
          error: 'Insufficient wallet balance',
          currentBalance,
          required: amountCents,
          shortfall: amountCents - currentBalance,
          canAutoRefill: true,
          autoRefillAmount: autoRefillUser.autoRefillAmount
        }, { status: 400 })
      }
      
      return NextResponse.json({ 
        error: 'Insufficient wallet balance',
        currentBalance,
        required: amountCents,
        shortfall: amountCents - currentBalance,
        canAutoRefill: false
      }, { status: 400 })
    }

    // Start database transaction for atomic operations
    const session_db = await User.startSession()
    
    try {
      await session_db.withTransaction(async () => {
        // Deduct from wallet
        const updatedUser = await User.findByIdAndUpdate(
          session.user.id,
          { $inc: { walletBalance: -amountCents } },
          { new: true, session: session_db }
        )

        if (!updatedUser) {
          throw new Error('Failed to update user wallet')
        }

        // Create wallet transaction record
        const walletTransaction = new WalletTransaction({
          userId: session.user.id,
          type: 'debit',
          amount: amountCents,
          description: `Donation to "${project.title}"`,
          status: 'completed',
          relatedProjectId: safeId,
          balanceBefore: currentBalance,
          balanceAfter: currentBalance - amountCents,
          metadata: {
            donationType: 'wallet_quick_donate',
            projectTitle: project.title
          }
        })

        await walletTransaction.save({ session: session_db })

        // Create donation record
        const donation = new Donation({
          userId: session.user.id,
          projectId: safeId,
          email: user.email,
          externalId: `wallet_${nanoid()}`,
          source: 'wallet',
          kind: 'one_time',
          currency: 'usd',
          amount: amountCents,
          campaign: String(safeId)
        })

        await donation.save({ session: session_db })

        // Update project total raised
        const updatedProject = await Project.findByIdAndUpdate(
          safeId,
          { $inc: { totalRaised: amountCents } },
          { new: true, session: session_db }
        )

        // Check if project is ready for build phase after this donation
        if (updatedProject?.isReadyForBuild() && !updatedProject.readyForBuildNotified) {
          await Project.findByIdAndUpdate(
            safeId,
            { readyForBuildNotified: false }, // Will trigger admin notification
            { session: session_db }
          )
        }
      })

      return NextResponse.json({
        success: true,
        message: `Successfully donated $${(amountCents / 100).toFixed(2)} to "${project.title}"`,
        newBalance: currentBalance - amountCents,
        newBalanceDollars: ((currentBalance - amountCents) / 100).toFixed(2),
        donationAmount: amountCents,
        donationAmountDollars: (amountCents / 100).toFixed(2)
      })

    } finally {
      await session_db.endSession()
    }
    
  } catch (error: any) {
    console.error('Quick donate error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process donation' },
      { status: 500 }
    )
  }
}