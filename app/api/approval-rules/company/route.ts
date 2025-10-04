import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/mongodb';
import ApprovalRule from '@/models/ApprovalRule';
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

    await dbConnect();

    // Get all active approval rules for the company
    const rules = await ApprovalRule.find({
      companyId: session.user.companyId,
      isActive: true,
    })
      .populate('approvalSteps.approverId', 'name email role')
      .populate('specificApproverId', 'name email role')
      .sort({ createdAt: -1 });

    return NextResponse.json({
      rules,
      total: rules.length,
    });
  } catch (error: any) {
    console.error('Get approval rules error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
