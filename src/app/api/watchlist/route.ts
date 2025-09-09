import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { projectId } = await req.json()
  if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 })

  const db = (await clientPromise).db()
  await db.collection('watchlist').updateOne(
    { userId: new ObjectId(session.user.id), projectId: new ObjectId(projectId) },
    { $setOnInsert: { createdAt: new Date() } },
    { upsert: true },
  )
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const projectId = new URL(req.url).searchParams.get('projectId')
  if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 })

  const db = (await clientPromise).db()
  await db.collection('watchlist').deleteOne({
    userId: new ObjectId(session.user.id),
    projectId: new ObjectId(projectId),
  })
  return NextResponse.json({ ok: true })
}
