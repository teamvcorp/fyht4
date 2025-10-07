// src/app/projects/[id]/page.tsx
import { notFound } from 'next/navigation'
import { type Metadata } from 'next'
import { ObjectId as MongoObjectId } from 'mongodb'
import mongoose, { Types } from 'mongoose'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongoose'
import Project, { IProject } from '@/models/Project'
import { serializeDoc, serializeDocs } from '@/lib/serializers'

import { RootLayout } from '@/components/RootLayout'
import { Container } from '@/components/Container'
import { FadeIn } from '@/components/FadeIn'
import ProjectDonatePanel from '@/components/projects/ProjectDonatePanel'
import WatchButton from '@/components/projects/WatchButton'
import ProjectGrid from '@/components/dashboard/ProjectGrid'

export const dynamic = 'force-dynamic'

// A clean, plain-object type for lean() results
type ProjectLean = Omit<IProject, keyof mongoose.Document> & { _id: Types.ObjectId }

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id: raw } = await params
  const id = decodeURIComponent(raw)

  await dbConnect()

  let project: ProjectLean | null = null
  if (MongoObjectId.isValid(id)) {
    project = await Project.findById(id).lean<ProjectLean>()
  }
  if (!project) {
    project = await Project.findOne({ slug: id }).lean<ProjectLean>()
  }
  if (!project) return { title: 'Project not found' }

  return {
    title: `${project.title} – FYHT4`,
    description: project.shortDescription || 'Community-led project',
    openGraph: {
      title: project.title,
      description: project.shortDescription || '',
      images: project.coverImage ? [{ url: project.coverImage }] : [],
    },
  }
}

export default async function ProjectPage(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: raw } = await params
  const id = decodeURIComponent(raw)

  const session = await getServerSession(authOptions)
  await dbConnect()

  // Load project (by ObjectId, then slug)
  let project: ProjectLean | null = null
  if (MongoObjectId.isValid(id)) {
    project = await Project.findById(id)
      .select('title slug shortDescription description category zipcode city state coverImage status voteGoal votesYes votesNo fundingGoal totalRaised createdAt buildStartedAt completedAt')
      .lean<ProjectLean>()
  }
  if (!project) {
    project = await Project.findOne({ slug: id })
      .select('title slug shortDescription description category zipcode city state coverImage status voteGoal votesYes votesNo fundingGoal totalRaised createdAt buildStartedAt completedAt')
      .lean<ProjectLean>()
  }
  if (!project) notFound()
  
  // Calculate progress percentages
  const votePct = project.voteGoal && project.voteGoal > 0 
    ? Math.min(100, Math.round(((project.votesYes || 0) / project.voteGoal) * 100)) 
    : 0
  const fundPct = project.fundingGoal && project.fundingGoal > 0 
    ? Math.min(100, Math.round(((project.totalRaised || 0) / project.fundingGoal) * 100)) 
    : 0

  // Is the current user watching?
  let isWatching = false
  if (session?.user?.id) {
    try {
      const entry = await mongoose.connection
        .collection('watchlist') // keep your existing collection name
        .findOne({
          userId: new MongoObjectId(session.user.id),
          // convert the Mongoose ObjectId to native for this raw query
          projectId: new MongoObjectId(String(project._id)),
        })
      isWatching = !!entry
    } catch {
      isWatching = false
    }
  }

  // Related by ZIP (optional)
  const relatedRaw = project.zipcode
    ? await Project.find({
        zipcode: String(project.zipcode),
        _id: { $ne: project._id },
      })
        .select('title category zipcode shortDescription coverImage status createdAt')
        .sort({ createdAt: -1 })
        .limit(6)
        .lean<ProjectLean[]>()
    : []

  // JSON-safe for client components
  const projectPlain = serializeDoc(project)
  const related = serializeDocs(relatedRaw)

  return (
    <RootLayout>
      <Container className="mt-12 sm:mt-16">
        <FadeIn className="mx-auto max-w-5xl">
          {/* Cover */}
          {projectPlain.coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={projectPlain.coverImage}
              alt=""
              className="h-64 w-full rounded-3xl object-cover"
            />
          ) : (
            <div className="h-64 w-full rounded-3xl bg-neutral-100" />
          )}

          {/* Header */}
          <div className="mt-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-wide text-neutral-500">
                {projectPlain.category || 'Project'}
                {projectPlain.zipcode ? ` • ZIP ${projectPlain.zipcode}` : ''}
              </p>
              <h1 className="mt-1 font-display text-3xl sm:text-4xl font-semibold text-neutral-900">
                {projectPlain.title}
              </h1>
              {projectPlain.shortDescription && (
                <p className="mt-2 text-neutral-700">{projectPlain.shortDescription}</p>
              )}
            </div>

            {/* Watch toggle (client) */}
            <WatchButton
              projectId={String(projectPlain._id)}
              initialWatching={isWatching}
            />
          </div>

          {/* Body */}
          {projectPlain.description && (
            <div className="prose prose-neutral mt-6 max-w-none">
              <p className="text-neutral-700 whitespace-pre-line">
                {projectPlain.description}
              </p>
            </div>
          )}

          {/* Funding Progress Stats - Prominent Display */}
          <div className="mt-8 rounded-3xl border-2 border-emerald-500 bg-gradient-to-br from-emerald-50 to-white p-6 sm:p-8 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-emerald-500 rounded-2xl">
                <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-neutral-900">
                  Project Funding Progress
                </h2>
                <p className="text-neutral-600">Help us reach our goal!</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Funding Goal Section */}
              <div className="bg-white rounded-2xl p-6 border border-emerald-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-neutral-600 uppercase tracking-wide">Funding Goal</h3>
                  <span className="text-2xl font-bold text-emerald-600">{fundPct}%</span>
                </div>
                
                {/* Progress Bar */}
                <div className="h-4 w-full rounded-full bg-neutral-100 overflow-hidden mb-4">
                  <div 
                    className="h-4 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-500"
                    style={{ width: `${fundPct}%` }}
                  />
                </div>

                {/* Amount Stats */}
                <div className="flex items-baseline justify-between">
                  <div>
                    <p className="text-3xl font-bold text-neutral-900">
                      ${((projectPlain.totalRaised || 0) / 100).toLocaleString()}
                    </p>
                    <p className="text-sm text-neutral-600">raised</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-semibold text-neutral-700">
                      ${((projectPlain.fundingGoal || 0) / 100).toLocaleString()}
                    </p>
                    <p className="text-sm text-neutral-600">goal</p>
                  </div>
                </div>

                {/* Remaining Amount */}
                {fundPct < 100 && (
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                    <p className="text-sm font-medium text-amber-900">
                      💪 Only ${(((projectPlain.fundingGoal || 0) - (projectPlain.totalRaised || 0)) / 100).toLocaleString()} more needed!
                    </p>
                  </div>
                )}

                {fundPct >= 100 && (
                  <div className="mt-4 p-3 bg-emerald-100 border border-emerald-300 rounded-xl">
                    <p className="text-sm font-medium text-emerald-900">
                      🎉 Funding goal reached! Thank you!
                    </p>
                  </div>
                )}
              </div>

              {/* Voting Section */}
              <div className="bg-white rounded-2xl p-6 border border-indigo-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-neutral-600 uppercase tracking-wide">Community Votes</h3>
                  <span className="text-2xl font-bold text-indigo-600">{votePct}%</span>
                </div>
                
                {/* Progress Bar */}
                <div className="h-4 w-full rounded-full bg-neutral-100 overflow-hidden mb-4">
                  <div 
                    className="h-4 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-500"
                    style={{ width: `${votePct}%` }}
                  />
                </div>

                {/* Vote Stats */}
                <div className="flex items-baseline justify-between">
                  <div>
                    <p className="text-3xl font-bold text-neutral-900">
                      {projectPlain.votesYes || 0}
                    </p>
                    <p className="text-sm text-neutral-600">yes votes</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-semibold text-neutral-700">
                      {projectPlain.voteGoal || 0}
                    </p>
                    <p className="text-sm text-neutral-600">goal</p>
                  </div>
                </div>

                {/* Status */}
                {votePct < 100 && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                    <p className="text-sm font-medium text-blue-900">
                      🗳️ {(projectPlain.voteGoal || 0) - (projectPlain.votesYes || 0)} more votes needed
                    </p>
                  </div>
                )}

                {votePct >= 100 && (
                  <div className="mt-4 p-3 bg-indigo-100 border border-indigo-300 rounded-xl">
                    <p className="text-sm font-medium text-indigo-900">
                      ✅ Vote goal achieved!
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Project Status Badge */}
            <div className="mt-6 flex items-center justify-center gap-3 p-4 bg-white rounded-xl border border-neutral-200">
              <span className="text-sm font-medium text-neutral-600">Project Status:</span>
              <span className={`inline-flex items-center rounded-full px-4 py-1.5 text-sm font-semibold ${
                projectPlain.status === 'voting' ? 'bg-indigo-100 text-indigo-800' :
                projectPlain.status === 'funding' ? 'bg-amber-100 text-amber-800' :
                projectPlain.status === 'build' ? 'bg-blue-100 text-blue-800' :
                projectPlain.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                'bg-neutral-100 text-neutral-800'
              }`}>
                {projectPlain.status?.toUpperCase() || 'DRAFT'}
              </span>
            </div>
          </div>

          {/* Donate panel (client) */}
          <div className="mt-8">
            <ProjectDonatePanel
              projectId={String(projectPlain._id)}
              projectTitle={projectPlain.title}
            />
          </div>
        </FadeIn>
      </Container>

      {/* Related projects */}
      <Container className="mt-16 sm:mt-24 mb-24">
        <FadeIn>
          <h2 className="font-display text-2xl sm:text-3xl font-semibold text-neutral-900">
            More projects in {projectPlain.zipcode ? `ZIP ${projectPlain.zipcode}` : 'this area'}
          </h2>
          <p className="mt-2 text-neutral-600">Explore more community-led initiatives nearby.</p>
          <ProjectGrid items={related} emptyText="No related projects yet." />
        </FadeIn>
      </Container>
    </RootLayout>
  )
}
