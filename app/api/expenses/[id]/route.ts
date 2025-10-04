import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/mongodb';
import Expense from '@/models/Expense';
import ApprovalRequest from '@/models/ApprovalRequest';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(
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

    await dbConnect();

    // Find expense
    const expense = await Expense.findById(params.id)
      .populate('employeeId', 'name email')
      .populate('companyId', 'name defaultCurrency country');

    if (!expense) {
      return NextResponse.json(
        { error: 'Expense not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this expense
    // Employees can see their own, Admins/Managers can see their company's
    if (
      expense.employeeId._id.toString() !== session.user.id &&
      expense.companyId._id.toString() !== session.user.companyId
    ) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Get all approval requests with comments
    const approvals = await ApprovalRequest.find({
      expenseId: expense._id,
    })
      .populate('approverId', 'name email role')
      .sort({ stepNumber: 1 });

    return NextResponse.json({
      expense: {
        ...expense.toObject(),
        approvals,
      },
    });
  } catch (error: any) {
    console.error('Get expense error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
