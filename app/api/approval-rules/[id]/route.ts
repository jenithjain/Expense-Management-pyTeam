import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/mongodb';
import ApprovalRule from '@/models/ApprovalRule';
import { UserRole } from '@/models/User';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Case-insensitive role check
    const userRole = session.user.role?.toUpperCase();
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    await dbConnect();

    const rule = await ApprovalRule.findByIdAndDelete(params.id);

    if (!rule) {
      return NextResponse.json(
        { error: 'Approval rule not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Approval rule deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete approval rule error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
