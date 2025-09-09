import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export const runtime = 'nodejs'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = (await clientPromise).db()
  const user = await db.collection('users').findOne(
    { _id: new ObjectId(session.user.id) },
    { projection: { name: 1, email: 1, zipcode: 1 } },
  )
  return NextResponse.json({ user })
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const { name, zipcode } = body as { name?: string; zipcode?: string }

  if (zipcode && !/^\d{5}(-\d{4})?$/.test(zipcode)) {
    return NextResponse.json({ error: 'Invalid ZIP' }, { status: 400 })
  }

  const db = (await clientPromise).db()
  await db
    .collection('users')
    .updateOne({ _id: new ObjectId(session.user.id) }, { $set: { ...(name ? { name } : {}), ...(zipcode !== undefined ? { zipcode: String(zipcode) } : {}) } })

  return NextResponse.json({ ok: true })
}
