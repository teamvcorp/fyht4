// app/projects/[id]/page.tsx
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ObjectId } from 'mongodb'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'
import dbConnect from '@/lib/mongoose'
// Ensure Mongoose connection & import model/types

import Project, { type IProject } from '@/models/Project'

import { serializeDoc, serializeDocs } from '@/lib/serializers'

import { RootLayout } from '@/components/RootLayout'
import { Container } from '@/components/Container'
import { FadeIn } from '@/components/FadeIn'
import ProjectDonatePanel from '@/components/projects/ProjectDonatePanel'
import WatchButton from '@/components/projects/WatchButton'
import ProjectGrid from '@/components/dashboard/ProjectGrid'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function generateMetadata(
  { params }: { params: { id: string } }
): Promise<Metadata> {
  // params is always a plain object, not a Promise, so you do not need to await it.
  // You can use params directly:
  const id = decodeURIComponent(params.id)

  let project: (IProject & { _id: ObjectId }) | null = null
  if (ObjectId.isValid(id)) {
    project = (await Project.findById(id).lean()) as any
  }
  if (!project) {
    project = (await Project.findOne({ slug: id }).lean()) as any
  }
  if (!project) return { title: 'Project not found' }

  return {
    title: `${project.title} – FYHT4`,
    description: project.shortDescription || 'Community-led project',
    openGraph: {
      title: project.title,
      description: project.shortDescription || '',
      images: project.coverImage ? [{ url: String(project.coverImage) }] : [],
    },
  }
}

export default async function ProjectPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  const db = (await clientPromise).db()
   await dbConnect()

  const id = decodeURIComponent(params.id)

  // Fetch project by ObjectId or slug
  let project: any = null
  if (ObjectId.isValid(id)) {
    project = await Project.findById(id).lean()
  }
  if (!project) {
    project = await Project.findOne({ slug: id }).lean()
  }
  if (!project) notFound()

  // Is current user watching?
  let isWatching = false
  if (session?.user?.id) {
    const entry = await db.collection('watchlist').findOne({
      userId: new ObjectId(session.user.id),
      projectId: new ObjectId(project._id),
    })
    isWatching = !!entry
  }

  // Related by ZIP (exclude self)
  const relatedRaw = project.zipcode
    ? await Project.find({
        zipcode: String(project.zipcode),
        _id: { $ne: project._id },
      })
        .select('title category zipcode shortDescription coverImage status createdAt')
        .sort({ createdAt: -1 })
        .limit(6)
        .lean()
    : []

  // Convert Mongo types to JSON-safe
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
          <ProjectGrid items={related as any[]} emptyText="No related projects yet." />
        </FadeIn>
      </Container>
    </RootLayout>
  )
}
