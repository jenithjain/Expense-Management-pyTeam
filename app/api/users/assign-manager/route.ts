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
    const { userId, managerId } = body

    if (!userId || !managerId) {
      return NextResponse.json(
        { error: 'Missing required fields: userId and managerId' },
        { status: 400 }
      )
    }

    // Verify the manager exists and has appropriate role
    const manager = await User.findById(managerId)
    if (!manager) {
      return NextResponse.json(
        { error: 'Manager not found' },
        { status: 404 }
      )
    }

    // Check if manager has appropriate role
    if (manager.role !== UserRole.MANAGER && manager.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Assigned user must be a manager or admin' },
        { status: 400 }
      )
    }

    // Update the user's manager
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { managerId: managerId },
      { new: true }
    )
      .populate('managerId', 'name email')
      .select('-password')

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
        managerId: updatedUser.managerId,
      }
    })
  } catch (error: any) {
    console.error('Error assigning manager:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
