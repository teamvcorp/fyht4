// app/projects/page.tsx
import { type Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'
import { type Filter, type Sort, ObjectId } from 'mongodb'
import { serializeDocs } from '@/lib/serializers'

import { RootLayout } from '@/components/RootLayout'
import { Container } from '@/components/Container'
import { FadeIn } from '@/components/FadeIn'
import { PageIntro } from '@/components/PageIntro'
import ProjectsToolbar from '@/components/projects/ProjectsToolbar'
import WatchButton from '@/components/projects/WatchButton'
import VoteButtons from '@/components/projects/VoteButtons'
import DonateNowButton from '@/components/projects/DonateNowButton'


type SessionUser = {
  id?: string
  email?: string | null
  // If you already inject a snapshot into the session, this will be used first.
  activeSubscription?: { status?: string; currentPeriodEnd?: string | Date | null }
  hasActiveSubscription?: boolean // legacy; still honored if present
}


type ProjectStatus = 'voting' | 'funding' | 'build' | 'completed'
type Project = {
  _id: ObjectId
  title: string
  slug?: string
  category?: string
  zipcode?: string
  city?: string
  state?: string
  shortDescription?: string
  coverImage?: string | null
  status?: ProjectStatus
  fundingGoal?: number     // cents
  totalRaised?: number     // cents
  votesYes?: number
  votesNo?: number
  voteGoal?: number
  createdAt?: Date
}

export const metadata: Metadata = {
  title: 'Projects',
  description: 'Explore community-led projects. Sort by ZIP, city, or state and take action.',
}

export const runtime = 'nodejs' 
export const dynamic = 'force-dynamic'

export default async function ProjectsPage({
  searchParams,
}: {
  // Next.js 15 passes searchParams as a Promise
  searchParams: Promise<{ sort?: string | string[]; q?: string | string[] }>
}) {
  const { sort: sortParam, q: qParam } = await searchParams
  const sortRaw = Array.isArray(sortParam) ? sortParam[0] : sortParam
  const qRaw = Array.isArray(qParam) ? qParam[0] : qParam

  const sortBy = (sortRaw || 'latest').toLowerCase()
  const q = (qRaw || '').trim()

  const session = await getServerSession(authOptions)
  const db = (await clientPromise).db()
  const projectsCol = db.collection<Project>('projects')

const isMember = !!session?.user?.id

// 1) Prefer what we already know on the session (keeps page fast)
const sUser = session?.user as SessionUser | undefined
let canSubmit =
  Boolean(sUser?.hasActiveSubscription) || // legacy flag if you still set it
  ['active', 'trialing'].includes(String(sUser?.activeSubscription?.status || ''))

// 2) Fallback: read from DB
if (isMember && !canSubmit) {
  // Safely resolve the user doc even if the session id isn't a Mongo ObjectId
  const selector =
    (sUser?.id && ObjectId.isValid(String(sUser.id)))
      ? { _id: new ObjectId(String(sUser.id)) }
      : (sUser?.email ? { email: sUser.email.toLowerCase() } : null)

  if (selector) {
    const u = await db.collection('users').findOne(
      selector,
      {
        projection: {
          'activeSubscription.status': 1,
          'activeSubscription.currentPeriodEnd': 1,
          'activeSubscription.cancelAtPeriodEnd': 1,
        },
      }
    )

    const status = u?.activeSubscription?.status as
      | 'trialing' | 'active' | 'past_due' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'unpaid'
      | undefined

    // Treat only active/trialing as “can submit” (mirrors your old logic)
    canSubmit = status === 'active' || status === 'trialing'

    // Optional: also ensure the period hasn’t already ended
    if (canSubmit && u?.activeSubscription?.currentPeriodEnd) {
      const end = new Date(u.activeSubscription.currentPeriodEnd)
      if (Number.isFinite(+end) && end < new Date()) {
        canSubmit = false
      }
    }
  } else {
    // No valid selector; safest default is false
    canSubmit = false
  }
}


  const filter: Filter<Project> = {}
  if (q) {
    Object.assign(filter, {
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { shortDescription: { $regex: q, $options: 'i' } },
        { zipcode: { $regex: q, $options: 'i' } },
        { city: { $regex: q, $options: 'i' } },
        { state: { $regex: q, $options: 'i' } },
      ],
    })
  }

  const sort: Sort =
    sortBy === 'zipcode' ? { zipcode: 1, createdAt: -1 } :
    sortBy === 'city'    ? { city: 1, createdAt: -1 } :
    sortBy === 'state'   ? { state: 1, createdAt: -1 } :
    { createdAt: -1 }

  const projectsRaw = await projectsCol
    .find(filter, {
      projection: {
        title: 1, slug: 1, category: 1, zipcode: 1, city: 1, state: 1,
        shortDescription: 1, coverImage: 1, status: 1,
        fundingGoal: 1, totalRaised: 1,
        votesYes: 1, votesNo: 1, voteGoal: 1, createdAt: 1,
      },
    })
    .sort(sort)
    .limit(48)
    .toArray()

  const projects = serializeDocs(projectsRaw) as Array<
    Omit<Project, '_id' | 'createdAt'> & { _id: string; createdAt?: string }
  >

  return (
    <RootLayout>
      <PageIntro eyebrow="Projects" title="Explore and take action">
        <p>Sort by location, then watch, vote, or donate to the projects you care about.</p>

        {/* Conditional proposal button / upsell */}
        {isMember ? (
          canSubmit ? (
            <div className="mt-6">
              <a
                href="/projects/submit"
                className="inline-flex items-center rounded-2xl bg-emerald-600 px-5 py-2.5 text-white font-semibold hover:bg-emerald-700 transition"
              >
                Submit a proposal
              </a>
            </div>
          ) : (
            <p className="mt-6 text-sm text-neutral-600">
              Want to submit a proposal? Become a monthly supporter first.&nbsp;
              <a href="/donate?frequency=monthly" className="underline hover:text-neutral-900">
                Start a monthly membership →
              </a>
            </p>
          )
        ) : (
          <p className="mt-6 text-sm text-neutral-600">
            Sign in and become a monthly supporter to submit proposals.&nbsp;
            <a href="/membership" className="underline hover:text-neutral-900">
              Sign in →
            </a>
          </p>
        )}
      </PageIntro>

      <Container className="mt-6 sm:mt-10">
        <FadeIn>
          <ProjectsToolbar initialSort={sortBy} initialQuery={q} />
        </FadeIn>
      </Container>

      <Container className="mt-8 sm:mt-12 mb-24">
        <FadeIn>
          {projects.length === 0 ? (
            <p className="text-neutral-600">No projects match your search.</p>
          ) : (
            <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {projects.map((p) => {
                const raised = p.totalRaised ?? 0
                const goal = p.fundingGoal ?? 0
                const pct = goal > 0 ? Math.min(100, Math.round((raised / goal) * 100)) : 0
                const votesYes = p.votesYes ?? 0
                const voteGoal = p.voteGoal ?? 0

                return (
                  <li key={p._id} className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
                    {/* Cover */}
                    {p.coverImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.coverImage}
                        alt=""
                        className="h-40 w-full rounded-2xl object-cover"
                      />
                    ) : (
                      <div className="h-40 w-full rounded-2xl bg-neutral-100" />
                    )}

                    {/* Meta */}
                    <div className="mt-4">
                      <p className="text-xs uppercase tracking-wide text-neutral-500">
                        {p.category || 'Project'}
                        {p.city || p.state || p.zipcode ? (
                          <>
                            {' • '}
                            {[p.city, p.state].filter(Boolean).join(', ') || `ZIP ${p.zipcode}`}
                          </>
                        ) : null}
                      </p>
                      <a
                        href={`/projects/${p.slug || p._id}`}
                        className="mt-1 block font-display text-xl font-semibold text-neutral-900 hover:underline"
                      >
                        {p.title}
                      </a>
                      {p.shortDescription && (
                        <p className="mt-1 text-sm text-neutral-700 line-clamp-2">
                          {p.shortDescription}
                        </p>
                      )}
                    </div>

                    {/* Status & progress */}
                    <div className="mt-4 flex flex-col gap-2">
                      <div className="flex items-center justify-between text-sm text-neutral-600">
                        <span>Status: <span className="font-medium text-neutral-900">{p.status ?? 'voting'}</span></span>
                        {goal > 0 && (
                          <span>{Math.round(raised / 100).toLocaleString()} / {Math.round(goal / 100).toLocaleString()} USD</span>
                        )}
                      </div>
                      {goal > 0 && (
                        <div className="h-2 w-full rounded-full bg-neutral-100">
                          <div className="h-2 rounded-full bg-emerald-600" style={{ width: `${pct}%` }} />
                        </div>
                      )}
                      {typeof voteGoal === 'number' && p.status === 'voting' && (
                        <div className="text-xs text-neutral-600">
                          Votes: <span className="font-medium text-neutral-900">{votesYes}</span> / {voteGoal}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="mt-5 flex flex-wrap items-center gap-2">
                      {isMember ? (
                        <>
                          <WatchButton projectId={p._id} initialWatching={false} />
                          {p.status === 'voting' && <VoteButtons projectId={p._id} />}
                          <DonateNowButton projectId={p._id} projectTitle={p.title} />
                        </>
                      ) : (
                        <a
                          href="/membership"
                          className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800 transition"
                        >
                          Sign in to participate
                        </a>
                      )}
                      <a
                        href={`/projects/${p.slug || p._id}`}
                        className="ml-auto text-sm text-neutral-700 underline hover:text-neutral-900"
                      >
                        View details →
                      </a>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </FadeIn>
      </Container>
    </RootLayout>
  )
}
