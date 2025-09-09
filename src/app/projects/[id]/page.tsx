// app/projects/[id]/page.tsx
import { notFound } from 'next/navigation'
import { type Metadata } from 'next'
import { ObjectId } from 'mongodb'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'

import { RootLayout } from '@/components/RootLayout'
import { Container } from '@/components/Container'
import { FadeIn } from '@/components/FadeIn'
import ProjectDonatePanel from '@/components/projects/ProjectDonatePanel'
import WatchButton from '@/components/projects/WatchButton'
import ProjectGrid from '@/components/dashboard/ProjectGrid' // from earlier step (reused)

type Project = {
  _id: ObjectId
  title: string
  category?: string
  zipcode?: string
  shortDescription?: string
  description?: string
  coverImage?: string
  status?: string
}

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const db = (await clientPromise).db()
  const { id } = params
  let project: Project | null = null

  // try ObjectId, then fallback to slug
  if (ObjectId.isValid(id)) {
    project = await db.collection('projects').findOne({ _id: new ObjectId(id) })
  }
  if (!project) {
    project = await db.collection('projects').findOne({ slug: id } as any)
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

export default async function ProjectPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  const db = (await clientPromise).db()

  const { id } = params
  let project: Project | null = null

  if (ObjectId.isValid(id)) {
    project = await db.collection('projects').findOne({ _id: new ObjectId(id) })
  }
  if (!project) {
    project = await db.collection('projects').findOne({ slug: id } as any)
  }
  if (!project) notFound()

  // Is the current user watching?
  let isWatching = false
  if (session?.user?.id) {
    const entry = await db.collection('watchlist').findOne({
      userId: new ObjectId(session.user.id),
      projectId: project._id,
    })
    isWatching = !!entry
  }

  // Related by ZIP (optional)
  const related =
    project.zipcode
      ? await db
          .collection('projects')
          .find(
            { zipcode: String(project.zipcode), _id: { $ne: project._id } },
            { projection: { title: 1, category: 1, zipcode: 1, shortDescription: 1, coverImage: 1, status: 1 } },
          )
          .sort({ createdAt: -1 })
          .limit(6)
          .toArray()
      : []

  return (
    <RootLayout>
      <Container className="mt-12 sm:mt-16">
        <FadeIn className="mx-auto max-w-5xl">
          {/* Cover */}
          {project.coverImage ? (
            <img
              src={project.coverImage}
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
                {project.category || 'Project'}
                {project.zipcode ? ` • ZIP ${project.zipcode}` : ''}
              </p>
              <h1 className="mt-1 font-display text-3xl sm:text-4xl font-semibold text-neutral-900">
                {project.title}
              </h1>
              {project.shortDescription && (
                <p className="mt-2 text-neutral-700">{project.shortDescription}</p>
              )}
            </div>

            {/* Watch toggle (client) */}
            <WatchButton projectId={String(project._id)} initialWatching={isWatching} />
          </div>

          {/* Body */}
          {project.description && (
            <div className="prose prose-neutral mt-6 max-w-none">
              <p className="text-neutral-700 whitespace-pre-line">{project.description}</p>
            </div>
          )}

          {/* Donate panel (client) */}
          <div className="mt-8">
            <ProjectDonatePanel projectId={String(project._id)} projectTitle={project.title} />
          </div>
        </FadeIn>
      </Container>

      {/* Related projects */}
      <Container className="mt-16 sm:mt-24 mb-24">
        <FadeIn>
          <h2 className="font-display text-2xl sm:text-3xl font-semibold text-neutral-900">
            More projects in {project.zipcode ? `ZIP ${project.zipcode}` : 'this area'}
          </h2>
          <p className="mt-2 text-neutral-600">Explore more community-led initiatives nearby.</p>
          <ProjectGrid items={related as any[]} emptyText="No related projects yet." />
        </FadeIn>
      </Container>
    </RootLayout>
  )
}
