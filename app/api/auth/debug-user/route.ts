import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter required' },
        { status: 400 }
      )
    }

    await dbConnect()
    
    const user = await User.findOne({ email }).select('-password')

    if (!user) {
      return NextResponse.json(
        { error: 'User not found', email },
        { status: 404 }
      )
    }

    return NextResponse.json({
      found: true,
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        companyId: user.companyId,
        managerId: user.managerId,
      }
    })
  } catch (error: any) {
    console.error('Debug user error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
