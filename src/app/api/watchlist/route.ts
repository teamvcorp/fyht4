import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongoose'
import Watchlist from '@/models/Watchlist'
import mongoose from 'mongoose'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { projectId } = await req.json()
  if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 })

  await dbConnect()
  
  await Watchlist.updateOne(
    { userId: new mongoose.Types.ObjectId(session.user.id), projectId: new mongoose.Types.ObjectId(projectId) },
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

  await dbConnect()
  
  await Watchlist.deleteOne({
    userId: new mongoose.Types.ObjectId(session.user.id),
    projectId: new mongoose.Types.ObjectId(projectId),
  })
  return NextResponse.json({ ok: true })
}
