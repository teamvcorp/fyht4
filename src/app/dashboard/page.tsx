import { type Metadata } from 'next'
import { RootLayout } from '@/components/RootLayout'
import { Container } from '@/components/Container'
import { FadeIn } from '@/components/FadeIn'
import { PageIntro } from '@/components/PageIntro'
import { authOptions } from '@/lib/auth'
import { getServerSession } from 'next-auth'
import dbconnect from '@/lib/mongoose'
import User from '@/models/User'
import Project, {IProject} from '@/models/Project'
import Donation from '@/models/Donation'
import Watchlist from '@/models/Watchlist'
import { serializeDocs } from '@/lib/serializers'
import ProfileCard from '@/components/dashboard/ProfileCard'
import ProjectGrid from '@/components/dashboard/ProjectGrid'
import { isPromise } from 'util/types'
export const metadata: Metadata = {
  title: 'Dashboard',
  description:
    'Edit your profile and see projects you’ve donated to, are watching, and nearby projects in your ZIP code.',
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

  // User via Mongoose
  const user = await User.findById(session.user.id)
    .select('name email zipcode')
    .lean() as { name?: string; email?: string; zipcode?: string }

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

  // Local projects by ZIP
  const localProjectsRaw = user?.zipcode
    ? await Project.find({ zipcode: String(user.zipcode) })
        .select('title category zipcode shortDescription coverImage status createdAt')
        .sort({ createdAt: -1 })
        .limit(12)
        .lean<IProject[]>()
    : []

  // JSON-safe for client components
  const donatedProjects = serializeDocs(donatedProjectsRaw)
  const watchingProjects = serializeDocs(watchingProjectsRaw)
  const localProjects = serializeDocs(localProjectsRaw)

  return (
    <RootLayout>
      <PageIntro eyebrow="Dashboard" title="Welcome back">
        <p>Manage your profile and keep track of projects you care about.</p>
      </PageIntro>

      <Container className="mt-8 sm:mt-12">
        <FadeIn>
          <ProfileCard
            user={{
              id: session.user.id,
              name: user?.name || '',
              email: user?.email || '',
              zipcode: (user?.zipcode ? String(user.zipcode) : '') || '',
            }}
          />
        </FadeIn>
      </Container>

      {/* Donated to */}
      <Container className="mt-16 sm:mt-24">
        <FadeIn>
          <h2 className="font-display text-2xl sm:text-3xl font-semibold text-neutral-900">
            Projects you’ve donated to
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
            Projects you’re watching
          </h2>
          <p className="mt-2 text-neutral-600">Stay in the loop on updates and milestones.</p>
          <ProjectGrid items={watchingProjects} emptyText="You aren’t watching any projects yet." />
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
