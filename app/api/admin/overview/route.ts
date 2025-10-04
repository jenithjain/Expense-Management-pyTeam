import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/mongodb';
import Expense, { ExpenseStatus } from '@/models/Expense';
import User, { UserRole } from '@/models/User';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import mongoose from 'mongoose';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    await dbConnect();

    const companyObjectId = new mongoose.Types.ObjectId(session.user.companyId);

    // Count users by role
    const totalUsers = await User.countDocuments({ companyId: companyObjectId });
    const totalEmployees = await User.countDocuments({ 
      companyId: companyObjectId,
      role: UserRole.EMPLOYEE 
    });
    const totalManagers = await User.countDocuments({ 
      companyId: companyObjectId,
      role: UserRole.MANAGER 
    });

    // Count expenses by status
    const totalExpenses = await Expense.countDocuments({ companyId: companyObjectId });
    const pendingExpenses = await Expense.countDocuments({ 
      companyId: companyObjectId,
      status: ExpenseStatus.PENDING 
    });
    const approvedExpenses = await Expense.countDocuments({ 
      companyId: companyObjectId,
      status: ExpenseStatus.APPROVED 
    });
    const rejectedExpenses = await Expense.countDocuments({ 
      companyId: companyObjectId,
      status: ExpenseStatus.REJECTED 
    });

    // Calculate total approved amount
    const totalAmountData = await Expense.aggregate([
      {
        $match: {
          companyId: companyObjectId,
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

    // Get monthly statistics
    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const currentMonthData = await Expense.aggregate([
      {
        $match: {
          companyId: companyObjectId,
          createdAt: { $gte: startOfCurrentMonth },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$convertedAmount' },
        },
      },
    ]);

    const previousMonthData = await Expense.aggregate([
      {
        $match: {
          companyId: companyObjectId,
          createdAt: {
            $gte: startOfPreviousMonth,
            $lte: endOfPreviousMonth,
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

    const currentMonth = currentMonthData[0]?.total || 0;
    const previousMonth = previousMonthData[0]?.total || 0;
    const percentageChange = previousMonth > 0 
      ? ((currentMonth - previousMonth) / previousMonth) * 100 
      : 0;

    // Get company default currency
    const Company = (await import('@/models/Company')).default;
    const company = await Company.findById(session.user.companyId);

    return NextResponse.json({
      totalUsers,
      totalEmployees,
      totalManagers,
      totalExpenses,
      pendingExpenses,
      approvedExpenses,
      rejectedExpenses,
      totalAmount: totalAmountData[0]?.total || 0,
      currency: company?.defaultCurrency || 'USD',
      monthlyStats: {
        currentMonth,
        previousMonth,
        percentageChange,
      },
    });
  } catch (error: any) {
    console.error('Admin overview error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
