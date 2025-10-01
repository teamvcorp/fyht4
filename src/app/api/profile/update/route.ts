import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongoose'
import User from '@/models/User'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, zipcode } = await req.json()

    await dbConnect()

    // Validate zipcode format if provided
    if (zipcode && !/^\d{5}(-\d{4})?$/.test(zipcode)) {
      return NextResponse.json({ 
        error: 'Invalid ZIP code format. Please use 5 digits (e.g., 12345) or ZIP+4 format (e.g., 12345-6789)' 
      }, { status: 400 })
    }

    // Update user profile
    const updatedUser = await User.findByIdAndUpdate(
      session.user.id,
      {
        $set: {
          name: name || null,
          zipcode: zipcode || null,
        },
      },
      { new: true }
    )

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true,
      user: {
        name: updatedUser.name,
        zipcode: updatedUser.zipcode,
      }
    })
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json({ 
      error: 'Failed to update profile' 
    }, { status: 500 })
  }
}