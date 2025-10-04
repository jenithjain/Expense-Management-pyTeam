import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/mongodb';
import Expense, { ExpenseStatus } from '@/models/Expense';
import { UserRole } from '@/models/User';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Allow admin role (case insensitive)
    const isAdmin = session?.user?.role?.toLowerCase() === 'admin';
    if (!session || !isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    await dbConnect();

    // Count expenses by status
    const totalExpenses = await Expense.countDocuments({
      companyId: session.user.companyId,
    });

    const pendingExpenses = await Expense.countDocuments({
      companyId: session.user.companyId,
      status: ExpenseStatus.PENDING,
    });

    const approvedExpenses = await Expense.countDocuments({
      companyId: session.user.companyId,
      status: ExpenseStatus.APPROVED,
    });

    const rejectedExpenses = await Expense.countDocuments({
      companyId: session.user.companyId,
      status: ExpenseStatus.REJECTED,
    });

    // Aggregate total approved amount
    const totalApprovedAmount = await Expense.aggregate([
      {
        $match: {
          companyId: session.user.companyId,
          status: ExpenseStatus.APPROVED,
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$convertedAmount' },
        },
      },
    ]);

    // Aggregate top 5 spending categories
    const topCategories = await Expense.aggregate([
      {
        $match: {
          companyId: session.user.companyId,
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
        $limit: 5,
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

    // Fetch 10 most recent expenses
    const recentExpenses = await Expense.find({
      companyId: session.user.companyId,
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('employeeId', 'name email')
      .select('amount convertedAmount category status date createdAt');

    return NextResponse.json({
      statistics: {
        totalExpenses,
        pendingExpenses,
        approvedExpenses,
        rejectedExpenses,
        totalApprovedAmount: totalApprovedAmount[0]?.total || 0,
      },
      topCategories,
      recentExpenses,
    });
  } catch (error: any) {
    console.error('Admin dashboard error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
