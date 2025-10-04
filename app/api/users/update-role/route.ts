import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import dbConnect from '@/lib/mongodb'
import User, { UserRole } from '@/models/User'

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get the current user
    await dbConnect()
    const currentUser = await User.findOne({ email: session.user.email })

    // Check if user is admin
    if (!currentUser || currentUser.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { userId, newRole } = body

    if (!userId || !newRole) {
      return NextResponse.json(
        { error: 'Missing required fields: userId and newRole' },
        { status: 400 }
      )
    }

    // Validate and normalize role
    let normalizedRole: UserRole
    const lowerRole = newRole.toLowerCase()
    
    if (lowerRole === 'admin') {
      normalizedRole = UserRole.ADMIN
    } else if (lowerRole === 'manager') {
      normalizedRole = UserRole.MANAGER
    } else if (lowerRole === 'employee') {
      normalizedRole = UserRole.EMPLOYEE
    } else {
      return NextResponse.json(
        { error: 'Invalid role. Must be employee, manager, or admin' },
        { status: 400 }
      )
    }

    // Update the user's role
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { role: normalizedRole },
      { new: true }
    ).select('-password')

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
      }
    })
  } catch (error: any) {
    console.error('Error updating user role:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
