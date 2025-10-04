import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/mongodb';
import ApprovalRule, { RuleType } from '@/models/ApprovalRule';
import { UserRole } from '@/models/User';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const {
      name,
      ruleType,
      approvalSteps,
      percentageRequired,
      specificApproverId,
    } = await req.json();

    // Validate required fields
    if (!name || !ruleType) {
      return NextResponse.json(
        { error: 'Name and rule type are required' },
        { status: 400 }
      );
    }

    // Validate rule type
    if (!Object.values(RuleType).includes(ruleType)) {
      return NextResponse.json(
        { error: 'Invalid rule type' },
        { status: 400 }
      );
    }

    // Validate based on rule type
    if (ruleType === RuleType.SEQUENTIAL && (!approvalSteps || approvalSteps.length === 0)) {
      return NextResponse.json(
        { error: 'Approval steps are required for SEQUENTIAL type' },
        { status: 400 }
      );
    }

    if (
      (ruleType === RuleType.PERCENTAGE || ruleType === RuleType.HYBRID) &&
      (percentageRequired === undefined || percentageRequired < 0 || percentageRequired > 100)
    ) {
      return NextResponse.json(
        { error: 'Valid percentage (0-100) is required for PERCENTAGE/HYBRID type' },
        { status: 400 }
      );
    }

    if (
      (ruleType === RuleType.SPECIFIC_APPROVER || ruleType === RuleType.HYBRID) &&
      !specificApproverId
    ) {
      return NextResponse.json(
        { error: 'Specific approver ID is required for SPECIFIC_APPROVER/HYBRID type' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Create approval rule
    const rule = await ApprovalRule.create({
      companyId: session.user.companyId,
      name,
      ruleType,
      approvalSteps: approvalSteps || [],
      percentageRequired,
      specificApproverId,
      isActive: true,
    });

    const populatedRule = await ApprovalRule.findById(rule._id).populate(
      'approvalSteps.approverId specificApproverId',
      'name email'
    );

    return NextResponse.json(
      {
        message: 'Approval rule created successfully',
        rule: populatedRule,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create approval rule error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
