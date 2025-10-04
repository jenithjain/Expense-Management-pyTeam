import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/mongodb';
import ApprovalRequest from '@/models/ApprovalRequest';
import { UserRole } from '@/models/User';
import { processApproval } from '@/lib/approval-engine';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(
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

    const userRole = session.user.role?.toUpperCase();
    if (userRole !== 'MANAGER' && userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Manager or Admin access required.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { action, comments } = body;

    // Validate action
    if (!action || (action !== 'APPROVE' && action !== 'REJECT')) {
      return NextResponse.json(
        { error: 'Invalid action. Must be APPROVE or REJECT.' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Find approval request
    const approvalRequest = await ApprovalRequest.findById(params.id).populate('expenseId');

    if (!approvalRequest) {
      return NextResponse.json(
        { error: 'Approval request not found' },
        { status: 404 }
      );
    }

    // Verify that the current user is the approver
    if (approvalRequest.approverId.toString() !== session.user.id) {
      return NextResponse.json(
        { error: 'You are not authorized to approve this request' },
        { status: 403 }
      );
    }

    // Process the approval
    const result = await processApproval(
      params.id,
      action as 'APPROVE' | 'REJECT',
      comments as string | undefined
    );

    return NextResponse.json({
      message: result.message,
      status: result.status,
      approvalRequest: await ApprovalRequest.findById(params.id)
        .populate('approverId', 'name email')
        .populate('expenseId'),
    });
  } catch (error: any) {
    console.error('Process approval error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
