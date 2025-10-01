// API endpoint for project recommendations
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongoose'
import User from '@/models/User'
import Project from '@/models/Project'
import Donation from '@/models/Donation'
import Watchlist from '@/models/Watchlist'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()

    const user = await User.findById(session.user.id).select('zipcode createdAt').lean()
    const recommendations: any[] = []

    // 1. Local projects (same ZIP code)
    if (user?.zipcode) {
      const localProjects = await Project.find({
        zipcode: user.zipcode,
        status: { $in: ['voting', 'funding'] }
      })
      .select('title category zipcode shortDescription status fundingGoal totalRaised votesYes voteGoal')
      .limit(2)
      .lean()

      localProjects.forEach(project => {
        recommendations.push({
          ...project,
          _id: String(project._id),
          reason: 'In your ZIP'
        })
      })
    }

    // 2. Projects user has donated to but not watching
    const donatedProjectIds = await Donation.find({ userId: session.user.id })
      .distinct('projectId')
    
    const watchedProjectIds = await Watchlist.find({ userId: session.user.id })
      .distinct('projectId')

    const donatedButNotWatched = donatedProjectIds.filter(id => 
      !watchedProjectIds.some(wId => wId.equals(id))
    )

    if (donatedButNotWatched.length > 0) {
      const relatedProjects = await Project.find({
        _id: { $in: donatedButNotWatched },
        status: { $in: ['voting', 'funding', 'build'] }
      })
      .select('title category zipcode shortDescription status fundingGoal totalRaised votesYes voteGoal')
      .limit(1)
      .lean()

      relatedProjects.forEach(project => {
        recommendations.push({
          ...project,
          _id: String(project._id),
          reason: 'You donated'
        })
      })
    }

    // 3. Trending projects (high vote-to-goal ratio)
    const trendingProjects = await Project.aggregate([
      { $match: { status: 'voting', voteGoal: { $gt: 0 } } },
      { 
        $addFields: { 
          voteRatio: { $divide: ['$votesYes', '$voteGoal'] }
        }
      },
      { $sort: { voteRatio: -1, createdAt: -1 } },
      { $limit: 2 },
      {
        $project: {
          title: 1,
          category: 1,
          zipcode: 1,
          shortDescription: 1,
          status: 1,
          fundingGoal: 1,
          totalRaised: 1,
          votesYes: 1,
          voteGoal: 1
        }
      }
    ])

    trendingProjects.forEach(project => {
      recommendations.push({
        ...project,
        _id: String(project._id),
        reason: 'Trending'
      })
    })

    // 4. New projects (for engagement)
    const newProjects = await Project.find({
      status: 'voting',
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
    })
    .select('title category zipcode shortDescription status fundingGoal totalRaised votesYes voteGoal')
    .sort({ createdAt: -1 })
    .limit(1)
    .lean()

    newProjects.forEach(project => {
      recommendations.push({
        ...project,
        _id: String(project._id),
        reason: 'New this week'
      })
    })

    // Remove duplicates and limit
    const uniqueRecommendations = recommendations
      .filter((rec, index, self) => 
        index === self.findIndex(r => r._id === rec._id)
      )
      .slice(0, 6)

    return NextResponse.json({ 
      success: true, 
      projects: uniqueRecommendations 
    })

  } catch (error) {
    console.error('Recommendations error:', error)
    return NextResponse.json({ 
      error: 'Failed to load recommendations' 
    }, { status: 500 })
  }
}