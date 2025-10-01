import { type Metadata } from 'next'
import { RootLayout } from '@/components/RootLayout'
import { Container } from '@/components/Container'
import { FadeIn } from '@/components/FadeIn'

import { authOptions } from '@/lib/auth'
import { getServerSession } from 'next-auth'
import dbconnect from '@/lib/mongoose'
import User from '@/models/User'
import Project, {IProject} from '@/models/Project'
import Donation from '@/models/Donation'
import Watchlist from '@/models/Watchlist'
import ProjectVote from '@/models/ProjectVote'
import { serializeDocs } from '@/lib/serializers'
import ProfileCard from '@/components/dashboard/ProfileCard'
import ProjectGrid from '@/components/dashboard/ProjectGrid'
import { ProjectRecommendations } from '@/components/ProjectRecommendations'
import { AchievementSystem } from '@/components/AchievementSystem'
import { OnboardingTour } from '@/components/OnboardingTour'

export const metadata: Metadata = {
  title: 'Dashboard',
  description:
    'Edit your profile and see projects you have donated to, are watching, and nearby projects in your ZIP code.',
}

export default async function DashboardPage() {
  await dbconnect()

  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return (
      <RootLayout>
        <Container className="mt-24 sm:mt-32">
          <FadeIn className="mx-auto max-w-2xl text-center">
            <h1 className="font-display text-4xl font-bold tracking-tight text-neutral-900">
              Please sign in
            </h1>
            <p className="mt-4 text-neutral-600">
              You need an account to view your dashboard. Head to the membership page to sign in.
            </p>
            <div className="mt-8">
              <a
                href="/membership"
                className="rounded-2xl bg-neutral-900 px-6 py-3 text-white font-semibold hover:bg-neutral-800 transition"
              >
                Go to Membership
              </a>
            </div>
          </FadeIn>
        </Container>
      </RootLayout>
    )
  }

  const user = await User.findById(session.user.id)
  if (!user) {
    return (
      <RootLayout>
        <Container className="mt-24 sm:mt-32">
          <FadeIn className="mx-auto max-w-2xl text-center">
            <h1 className="font-display text-4xl font-bold tracking-tight text-neutral-900">
              User not found
            </h1>
          </FadeIn>
        </Container>
      </RootLayout>
    )
  }

  // Donations -> populated projects
  const donationDocs = await Donation.find({ userId: session.user.id })
    .sort({ createdAt: -1 })
    .populate({
      path: 'projectId',
      select:
        'title category zipcode shortDescription coverImage status fundingGoal totalRaised votesYes voteGoal createdAt',
    })
    .lean()

  const donatedProjectsRaw = donationDocs
    .map(d => d.projectId)
    .filter(Boolean) as any[]

  // Watchlist -> populated projects
  const watchDocs = await Watchlist.find({ userId: session.user.id })
    .sort({ createdAt: -1 })
    .populate({
      path: 'projectId',
      select:
        'title category zipcode shortDescription coverImage status fundingGoal totalRaised votesYes voteGoal createdAt',
    })
    .lean()

  const watchingProjectsRaw = watchDocs
    .map(w => w.projectId)
    .filter(Boolean) as any[]

  // Voted projects -> populated projects  
  const voteDocs = await ProjectVote.find({ userId: session.user.id })
    .sort({ createdAt: -1 })
    .populate({
      path: 'projectId',
      select:
        'title category zipcode shortDescription coverImage status fundingGoal totalRaised votesYes voteGoal createdAt',
    })
    .lean()

  const votedProjectsRaw = voteDocs
    .map(v => v.projectId)
    .filter(Boolean) as any[]

  // Nearby projects (projects in the same ZIP as user)
  const localProjectsRaw = user?.zipcode
    ? await Project.find({ zipcode: user.zipcode })
        .sort({ createdAt: -1 })
        .limit(6)
        .lean<IProject[]>()
    : []

  // Check if user is new (less than 7 days)
  const isNewUser = user?.createdAt ? 
    (Date.now() - new Date(user.createdAt).getTime()) < (7 * 24 * 60 * 60 * 1000) 
    : true

  // JSON-safe for client components
  const donatedProjects = serializeDocs(donatedProjectsRaw)
  const watchingProjects = serializeDocs(watchingProjectsRaw)
  const votedProjects = serializeDocs(votedProjectsRaw)
  const localProjects = serializeDocs(localProjectsRaw)

  return (
    <RootLayout>
      <OnboardingTour />
      
      <Container className="mt-24 sm:mt-32">
        <FadeIn>
          <div className="max-w-2xl">
            <h1 className="font-display text-4xl font-bold tracking-tight text-neutral-900">
              Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}! 👋
            </h1>
            <p className="mt-4 text-xl text-neutral-600">
              Track your impact, discover local projects, and stay connected with your community.
            </p>
          </div>
        </FadeIn>
      </Container>

      {/* New user welcome section */}
      {isNewUser && (
        <Container className="mt-12">
          <FadeIn>
            <div className="rounded-3xl bg-gradient-to-r from-emerald-500 to-emerald-600 p-8 text-white">
              <div className="max-w-3xl">
                <h2 className="font-display text-2xl sm:text-3xl font-bold mb-4">
                  🎉 Welcome to the FYHT4 Community!
                </h2>
                <p className="text-emerald-100 mb-6 text-lg">
                  You're now part of a movement that turns community ideas into reality. Here's how to get started:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white/10 rounded-2xl p-4">
                    <div className="text-2xl mb-2">🗳️</div>
                    <h3 className="font-semibold mb-1">Vote on Projects</h3>
                    <p className="text-sm text-emerald-100">Shape what gets built in your ZIP code</p>
                  </div>
                  <div className="bg-white/10 rounded-2xl p-4">
                    <div className="text-2xl mb-2">💡</div>
                    <h3 className="font-semibold mb-1">Submit Ideas</h3>
                    <p className="text-sm text-emerald-100">Propose projects for your community</p>
                  </div>
                  <div className="bg-white/10 rounded-2xl p-4">
                    <div className="text-2xl mb-2">💰</div>
                    <h3 className="font-semibold mb-1">Fund Progress</h3>
                    <p className="text-sm text-emerald-100">Support projects you believe in</p>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>
        </Container>
      )}

      {/* Profile section */}
      <Container className="mt-16 sm:mt-24">
        <FadeIn>
          <ProfileCard
            user={{
              id: session.user.id,
              name: user.name || '',
              email: user.email || '',
              zipcode: user.zipcode || '',
            }}
          />
        </FadeIn>
      </Container>

      {/* Project Recommendations */}
      <Container className="mt-16 sm:mt-24">
        <FadeIn>
          <ProjectRecommendations />
        </FadeIn>
      </Container>

      {/* Achievement System */}
      <Container className="mt-16 sm:mt-24">
        <FadeIn>
          <AchievementSystem />
        </FadeIn>
      </Container>

      {/* Voted on */}
      <Container className="mt-16 sm:mt-24">
        <FadeIn>
          <h2 className="font-display text-2xl sm:text-3xl font-semibold text-neutral-900">
            Projects you've voted on
          </h2>
          <p className="mt-2 text-neutral-600">
            Your voice in the community - projects you've supported with your vote.
          </p>
          <ProjectGrid items={votedProjects} emptyText="You haven't voted on any projects yet." />
        </FadeIn>
      </Container>

      {/* Donated to */}
      <Container className="mt-16 sm:mt-24">
        <FadeIn>
          <h2 className="font-display text-2xl sm:text-3xl font-semibold text-neutral-900">
            Projects you've donated to
          </h2>
          <p className="mt-2 text-neutral-600">
            Thank you for your support. Here are recent projects you helped fund.
          </p>
          <ProjectGrid items={donatedProjects} emptyText="No donations yet." />
        </FadeIn>
      </Container>

      {/* Watching */}
      <Container className="mt-16 sm:mt-24">
        <FadeIn>
          <h2 className="font-display text-2xl sm:text-3xl font-semibold text-neutral-900">
            Projects you're watching
          </h2>
          <p className="mt-2 text-neutral-600">Stay in the loop on updates and milestones.</p>
          <ProjectGrid items={watchingProjects} emptyText="You aren't watching any projects yet." />
        </FadeIn>
      </Container>

      {/* Nearby */}
      <Container className="mt-16 sm:mt-24 mb-24">
        <FadeIn>
          <h2 className="font-display text-2xl sm:text-3xl font-semibold text-neutral-900">
            Projects near {user?.zipcode ? `ZIP ${user.zipcode}` : 'you'}
          </h2>
          <p className="mt-2 text-neutral-600">
            {user?.zipcode
              ? 'These are active projects in your area.'
              : 'Add your ZIP in your profile to see local projects.'}
          </p>
          <ProjectGrid
            items={localProjects}
            emptyText={user?.zipcode ? 'No local projects yet.' : 'Set your ZIP to view local projects.'}
          />
        </FadeIn>
      </Container>
    </RootLayout>
  )
}