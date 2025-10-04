import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/mongodb';
import User, { UserRole } from '@/models/User';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const { managerId, isManagerApprover } = await req.json();

    await dbConnect();

    // Find user in the same company
    const user = await User.findOne({
      _id: params.id,
      companyId: session.user.companyId,
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found in your company' },
        { status: 404 }
      );
    }

    // If managerId is provided, verify it exists in the same company
    if (managerId) {
      const manager = await User.findOne({
        _id: managerId,
        companyId: session.user.companyId,
      });

      if (!manager) {
        return NextResponse.json(
          { error: 'Manager not found in your company' },
          { status: 404 }
        );
      }

      user.managerId = managerId;
    } else {
      user.managerId = undefined;
    }

    // Update isManagerApprover if provided
    if (typeof isManagerApprover === 'boolean') {
      user.isManagerApprover = isManagerApprover;
    }

    await user.save();

    // Remove password from response
    const { password: _, ...userResponse } = user.toObject();

    return NextResponse.json({
      message: 'Manager assignment updated successfully',
      user: userResponse,
    });
  } catch (error: any) {
    console.error('Update manager error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
