import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/mongodb';
import Expense, { ExpenseStatus } from '@/models/Expense';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // All authenticated users can access employee dashboard
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    // Count expenses by status
    const totalExpenses = await Expense.countDocuments({
      employeeId: session.user.id,
    });

    const pendingExpenses = await Expense.countDocuments({
      employeeId: session.user.id,
      status: ExpenseStatus.PENDING,
    });

    const approvedExpenses = await Expense.countDocuments({
      employeeId: session.user.id,
      status: ExpenseStatus.APPROVED,
    });

    const rejectedExpenses = await Expense.countDocuments({
      employeeId: session.user.id,
      status: ExpenseStatus.REJECTED,
    });

    // Fetch 10 most recent expenses
    const recentExpenses = await Expense.find({
      employeeId: session.user.id,
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('amount convertedAmount category status date createdAt merchantName');

    // Aggregate current month's spending
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const currentMonthSpending = await Expense.aggregate([
      {
        $match: {
          employeeId: session.user.id,
          createdAt: {
            $gte: startOfMonth,
            $lte: endOfMonth,
          },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$convertedAmount' },
        },
      },
    ]);

    // Spending by category
    const spendingByCategory = await Expense.aggregate([
      {
        $match: {
          employeeId: session.user.id,
          status: ExpenseStatus.APPROVED,
        },
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$convertedAmount' },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { total: -1 },
      },
      {
        $project: {
          category: '$_id',
          total: 1,
          count: 1,
          _id: 0,
        },
      },
    ]);

    return NextResponse.json({
      statistics: {
        totalExpenses,
        pendingExpenses,
        approvedExpenses,
        rejectedExpenses,
        currentMonthSpending: currentMonthSpending[0]?.total || 0,
      },
      spendingByCategory,
      recentExpenses,
    });
  } catch (error: any) {
    console.error('Employee dashboard error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
