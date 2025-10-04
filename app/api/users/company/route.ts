import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/mongodb';
import User, { UserRole } from '@/models/User';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const roleFilter = searchParams.get('role');

    await dbConnect();

    // Build query
    const query: any = {
      companyId: session.user.companyId,
    };

    // Add role filter if provided
    if (roleFilter && Object.values(UserRole).includes(roleFilter as UserRole)) {
      query.role = roleFilter;
    }

    // Get all users in the company (excluding passwords)
    const users = await User.find(query)
      .select('-password')
      .populate('managerId', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    // Transform managerId to manager for frontend compatibility
    const transformedUsers = users.map((user: any) => ({
      ...user,
      manager: user.managerId ? {
        _id: user.managerId._id?.toString() || user.managerId,
        name: user.managerId.name,
        email: user.managerId.email,
      } : null,
      managerId: user.managerId?._id?.toString() || user.managerId,
    }));

    return NextResponse.json({
      users: transformedUsers,
      total: transformedUsers.length,
    });
  } catch (error: any) {
    console.error('Get company users error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
