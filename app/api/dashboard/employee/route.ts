import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/mongodb';
import Expense, { ExpenseStatus } from '@/models/Expense';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import mongoose from 'mongoose';

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

    // Convert string ID to ObjectId
    const employeeObjectId = new mongoose.Types.ObjectId(session.user.id);

    // Count expenses by status
    const totalExpenses = await Expense.countDocuments({
      employeeId: employeeObjectId,
    });

    const pendingExpenses = await Expense.countDocuments({
      employeeId: employeeObjectId,
      status: ExpenseStatus.PENDING,
    });

    const approvedExpenses = await Expense.countDocuments({
      employeeId: employeeObjectId,
      status: ExpenseStatus.APPROVED,
    });

    const rejectedExpenses = await Expense.countDocuments({
      employeeId: employeeObjectId,
      status: ExpenseStatus.REJECTED,
    });

    // Fetch 10 most recent expenses
    const recentExpenses = await Expense.find({
      employeeId: employeeObjectId,
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('amount convertedAmount category status date createdAt merchantName originalCurrency');

    // Aggregate current month's spending
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const currentMonthSpending = await Expense.aggregate([
      {
        $match: {
          employeeId: employeeObjectId,
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
          employeeId: employeeObjectId,
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

    // Get user's company default currency
    const User = (await import('@/models/User')).default;
    const Company = (await import('@/models/Company')).default;
    const user = await User.findById(session.user.id).populate('companyId');
    const currency = (user?.companyId as any)?.defaultCurrency || 'USD';

    // Calculate total amount from all approved expenses
    const totalAmountData = await Expense.aggregate([
      {
        $match: {
          employeeId: employeeObjectId,
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

    return NextResponse.json({
      totalExpenses,
      pendingExpenses,
      approvedExpenses,
      rejectedExpenses,
      totalAmount: totalAmountData[0]?.total || 0,
      currency,
      currentMonthSpending: currentMonthSpending[0]?.total || 0,
      spendingByCategory,
      recentExpenses: recentExpenses.map((expense: any) => ({
        _id: expense._id,
        merchantName: expense.merchantName || 'N/A',
        amount: expense.amount || 0,
        originalCurrency: expense.originalCurrency || 'USD',
        status: expense.status || 'Pending',
        date: expense.date || expense.createdAt,
      })),
    });
  } catch (error: any) {
    console.error('Employee dashboard error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
