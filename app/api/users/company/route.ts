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
      .sort({ createdAt: -1 });

    return NextResponse.json({
      users,
      total: users.length,
    });
  } catch (error: any) {
    console.error('Get company users error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
