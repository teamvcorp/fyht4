// API endpoint for achievements system
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongoose'
import User from '@/models/User'
import Project from '@/models/Project'
import Donation from '@/models/Donation'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()

    const userId = session.user.id
    const achievements = []

    // Get user data
    const user = await User.findById(userId).select('createdAt').lean()
    
    // Get user activity counts
    const [donationCount, voteCount, projectCount] = await Promise.all([
      Donation.countDocuments({ userId }),
      // You'll need to create a ProjectVote model for this
      // ProjectVote.countDocuments({ userId }),
      0, // Placeholder for vote count
      Project.countDocuments({ createdBy: userId })
    ])

    // Get monthly subscription status
    const hasActiveSubscription = user?.activeSubscription && 
      ['active', 'trialing'].includes(user.activeSubscription.status)

    // Calculate achievements
    const achievementData = [
      {
        id: 'first_donation',
        title: 'Community Supporter',
        description: 'Make your first donation',
        icon: '💝',
        unlocked: donationCount > 0,
        type: 'funding'
      },
      {
        id: 'first_vote',
        title: 'Democracy in Action', 
        description: 'Cast your first vote',
        icon: '🗳️',
        unlocked: voteCount > 0,
        type: 'voting'
      },
      {
        id: 'local_voter',
        title: 'Local Champion',
        description: 'Vote on 5 projects in your ZIP code',
        icon: '🏘️',
        unlocked: voteCount >= 5,
        progress: voteCount < 5 ? { current: voteCount, target: 5 } : undefined,
        type: 'voting'
      },
      {
        id: 'monthly_member',
        title: 'Steady Support',
        description: 'Maintain a monthly membership for 3 months',
        icon: '⭐',
        unlocked: hasActiveSubscription, // Simplified check
        type: 'funding'
      },
      {
        id: 'first_proposal',
        title: 'Idea Generator',
        description: 'Submit your first project proposal',
        icon: '💡',
        unlocked: projectCount > 0,
        type: 'proposing'
      },
      {
        id: 'early_adopter',
        title: 'Pioneer',
        description: 'One of the first 100 members',
        icon: '🌟',
        unlocked: user?.createdAt ? new Date(user.createdAt).getTime() < Date.now() - (30 * 24 * 60 * 60 * 1000) : false,
        type: 'community'
      }
    ]

    // Add unlock dates for unlocked achievements
    const achievementsWithDates = achievementData.map(achievement => ({
      ...achievement,
      unlockedAt: achievement.unlocked ? (user?.createdAt || new Date()).toISOString() : undefined
    }))

    return NextResponse.json({ 
      success: true, 
      achievements: achievementsWithDates 
    })

  } catch (error) {
    console.error('Achievements error:', error)
    return NextResponse.json({ 
      error: 'Failed to load achievements' 
    }, { status: 500 })
  }
}