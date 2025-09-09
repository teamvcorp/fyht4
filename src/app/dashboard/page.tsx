import { type Metadata } from 'next'
import { RootLayout } from '@/components/RootLayout'
import { Container } from '@/components/Container'
import { FadeIn } from '@/components/FadeIn'
import { PageIntro } from '@/components/PageIntro'
import clientPromise from '@/lib/mongodb'
import { authOptions } from '@/lib/auth'
import { getServerSession } from 'next-auth'
import { ObjectId } from 'mongodb'
import ProfileCard from '@/components/dashboard/ProfileCard'
import ProjectGrid from '@/components/projects/ProjectGrid'
import { serializeDocs } from '@/lib/serializers' // ⬅️ add this

export const metadata: Metadata = {
  title: 'Dashboard',
  description:
    'Edit your profile and see projects you’ve donated to, are watching, and nearby projects in your ZIP code.',
}

export default async function DashboardPage() {
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

  const db = (await clientPromise).db()
  const userId = new ObjectId(session.user.id)

  const user = await db.collection('users').findOne(
    { _id: userId },
    { projection: { name: 1, email: 1, zipcode: 1 } },
  )

  // Donations -> joined projects
  const donations = await db
    .collection('donations')
    .aggregate([
      { $match: { userId } },
      { $sort: { createdAt: -1 } },
      { $lookup: { from: 'projects', localField: 'projectId', foreignField: '_id', as: 'project' } },
      { $unwind: '$project' },
      {
        $project: {
          _id: 1,
          amount: 1,
          createdAt: 1,
          'project._id': 1,
          'project.title': 1,
          'project.category': 1,
          'project.zipcode': 1,
          'project.shortDescription': 1,
          'project.coverImage': 1,
          'project.status': 1,
          'project.fundingGoal': 1,
          'project.totalRaised': 1,
          'project.votesYes': 1,
          'project.voteGoal': 1,
        },
      },
    ])
    .toArray()

  // Watching -> joined projects
  const watching = await db
    .collection('watchlist')
    .aggregate([
      { $match: { userId } },
      { $sort: { createdAt: -1 } },
      { $lookup: { from: 'projects', localField: 'projectId', foreignField: '_id', as: 'project' } },
      { $unwind: '$project' },
      {
        $project: {
          _id: 1,
          createdAt: 1,
          'project._id': 1,
          'project.title': 1,
          'project.category': 1,
          'project.zipcode': 1,
          'project.shortDescription': 1,
          'project.coverImage': 1,
          'project.status': 1,
          'project.fundingGoal': 1,
          'project.totalRaised': 1,
          'project.votesYes': 1,
          'project.voteGoal': 1,
        },
      },
    ])
    .toArray()

  // Local projects
  const localProjects =
    user?.zipcode
      ? await db
          .collection('projects')
          .find(
            { zipcode: String(user.zipcode) },
            {
              projection: {
                title: 1,
                category: 1,
                zipcode: 1,
                shortDescription: 1,
                coverImage: 1,
                status: 1,
                fundingGoal: 1,
                totalRaised: 1,
                votesYes: 1,
                voteGoal: 1,
                createdAt: 1,
              },
            },
          )
          .sort({ createdAt: -1 })
          .limit(12)
          .toArray()
      : []

  // ✅ Make props JSON-safe for client components
  const donatedProjects = serializeDocs(donations.map((d) => d.project))
  const watchingProjects = serializeDocs(watching.map((w) => w.project))
  const localProjectsPlain = serializeDocs(localProjects)

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
            items={localProjectsPlain}
            emptyText={user?.zipcode ? 'No local projects yet.' : 'Set your ZIP to view local projects.'}
          />
        </FadeIn>
      </Container>
    </RootLayout>
  )
}
