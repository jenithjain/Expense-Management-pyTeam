import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/mongodb';
import ApprovalRequest, { ApprovalStatus } from '@/models/ApprovalRequest';
import { UserRole } from '@/models/User';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Allow manager and admin roles (case insensitive)
    const allowedRoles = ['manager', 'admin', 'MANAGER', 'ADMIN'];
    if (!session || !allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized. Manager or Admin access required.' },
        { status: 403 }
      );
    }

    await dbConnect();

    // Get pending approval requests for the current user
    const approvals = await ApprovalRequest.find({
      approverId: session.user.id,
      status: ApprovalStatus.PENDING,
    })
      .populate({
        path: 'expenseId',
        populate: {
          path: 'employeeId companyId',
          select: 'name email defaultCurrency',
        },
      })
      .sort({ createdAt: -1 });

    // Transform the data to match frontend expectations
    const approvalRequests = approvals.map((approval: any) => ({
      _id: approval._id,
      status: approval.status,
      comments: approval.comments,
      expense: {
        _id: approval.expenseId?._id,
        merchantName: approval.expenseId?.merchantName || 'N/A',
        description: approval.expenseId?.description || 'N/A',
        date: approval.expenseId?.date,
        category: approval.expenseId?.category || 'N/A',
        amount: approval.expenseId?.amount || 0,
        originalCurrency: approval.expenseId?.originalCurrency || 'USD',
        convertedAmount: approval.expenseId?.convertedAmount || 0,
        companyDefaultCurrency: approval.expenseId?.companyId?.defaultCurrency || 'USD',
        receiptUrl: approval.expenseId?.receiptUrl,
        employee: {
          name: approval.expenseId?.employeeId?.name || 'Unknown',
          email: approval.expenseId?.employeeId?.email || 'N/A',
        },
      },
    }));

    return NextResponse.json({
      approvalRequests,
      total: approvalRequests.length,
    });
  } catch (error: any) {
    console.error('Get pending approvals error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
