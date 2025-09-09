import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { getAdminOrResponse } from '@/lib/guard'

export const runtime = 'nodejs'

export async function GET() {
  const session = await getAdminOrResponse()
  if (session instanceof Response) return session

  const db = (await clientPromise).db()
  const items = await db
    .collection('project_proposals')
    .find({ status: 'pending' })
    .sort({ createdAt: -1 })
    .toArray()

  return NextResponse.json({ items })
}
