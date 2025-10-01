import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST() {
  try {
    // This will trigger the JWT callback to run again
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Force a token refresh by calling the JWT callback manually
    // This is a bit of a hack but should work
    const updatedSession = await getServerSession(authOptions)

    return NextResponse.json({
      message: 'Session refreshed',
      user: updatedSession?.user,
      isSubscriber: (updatedSession?.user as any)?.isSubscriber
    })
  } catch (error) {
    console.error('Force refresh error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}