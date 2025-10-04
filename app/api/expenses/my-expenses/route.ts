import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/mongodb';
import Expense from '@/models/Expense';
import ApprovalRequest from '@/models/ApprovalRequest';
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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');

    await dbConnect();

    // Build query
    const query: any = {
      employeeId: session.user.id,
    };

    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    // Get expenses with pagination
    const expenses = await Expense.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('employeeId', 'name email')
      .populate('companyId', 'name defaultCurrency');

    // Get approval status for each expense
    const expensesWithApprovals = await Promise.all(
      expenses.map(async (expense) => {
        const approvals = await ApprovalRequest.find({
          expenseId: expense._id,
        })
          .populate('approverId', 'name email')
          .sort({ stepNumber: 1 });

        return {
          ...expense.toObject(),
          approvals,
        };
      })
    );

    const total = await Expense.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    // Transform expenses to match frontend expectations
    const transformedExpenses = expensesWithApprovals.map((expense: any) => ({
      _id: expense._id,
      merchantName: expense.merchantName || 'N/A',
      description: expense.description || 'N/A',
      date: expense.date,
      category: expense.category || 'N/A',
      amount: expense.amount || 0,
      originalCurrency: expense.originalCurrency || 'USD',
      convertedAmount: expense.convertedAmount || 0,
      companyDefaultCurrency: expense.companyId?.defaultCurrency || 'USD',
      status: expense.status || 'Pending',
      receiptUrl: expense.receiptUrl,
      createdAt: expense.createdAt,
      approvals: expense.approvals,
    }));

    return NextResponse.json({
      expenses: transformedExpenses,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error: any) {
    console.error('Get my expenses error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
