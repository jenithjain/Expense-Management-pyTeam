import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/mongodb';
import ApprovalRule from '@/models/ApprovalRule';
import { UserRole } from '@/models/User';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import mongoose from 'mongoose';

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

    const companyObjectId = new mongoose.Types.ObjectId(session.user.companyId);

    const rules = await ApprovalRule.find({ companyId: companyObjectId })
      .sort({ createdAt: -1 });

    return NextResponse.json({
      rules: rules.map((rule: any) => ({
        _id: rule._id,
        category: rule.category,
        minAmount: rule.minAmount,
        maxAmount: rule.maxAmount,
        approvers: rule.approvers,
        requireAllApprovers: rule.requireAllApprovers,
        minApprovalPercentage: rule.minApprovalPercentage,
        specificApproverId: rule.specificApproverId,
        isManagerFirst: rule.isManagerFirst,
      })),
    });
  } catch (error: any) {
    console.error('Get approval rules error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const {
      category,
      minAmount,
      maxAmount,
      approvers,
      requireAllApprovers,
      minApprovalPercentage,
      specificApproverId,
      isManagerFirst,
    } = await req.json();

    if (!category || !approvers || approvers.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await dbConnect();

    const rule = await ApprovalRule.create({
      companyId: new mongoose.Types.ObjectId(session.user.companyId),
      category,
      minAmount: minAmount || undefined,
      maxAmount: maxAmount || undefined,
      approvers,
      requireAllApprovers: requireAllApprovers !== false,
      minApprovalPercentage: minApprovalPercentage || undefined,
      specificApproverId: specificApproverId || undefined,
      isManagerFirst: isManagerFirst !== false,
    });

    return NextResponse.json({
      message: 'Approval rule created successfully',
      rule: {
        _id: rule._id,
        category: rule.category,
        approvers: rule.approvers,
      },
    });
  } catch (error: any) {
    console.error('Create approval rule error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
