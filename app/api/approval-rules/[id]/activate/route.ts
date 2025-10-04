import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/mongodb';
import ApprovalRule from '@/models/ApprovalRule';
import { UserRole } from '@/models/User';
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

    await dbConnect();

    // Find rule in the same company
    const rule = await ApprovalRule.findOne({
      _id: params.id,
      companyId: session.user.companyId,
    });

    if (!rule) {
      return NextResponse.json(
        { error: 'Approval rule not found in your company' },
        { status: 404 }
      );
    }

    // Toggle isActive status
    rule.isActive = !rule.isActive;
    await rule.save();

    return NextResponse.json({
      message: `Approval rule ${rule.isActive ? 'activated' : 'deactivated'} successfully`,
      rule,
    });
  } catch (error: any) {
    console.error('Toggle approval rule error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
