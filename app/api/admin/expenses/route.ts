import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/mongodb';
import Expense from '@/models/Expense';
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

    const userRole = session.user.role?.toUpperCase();
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    await dbConnect();

    const companyObjectId = new mongoose.Types.ObjectId(session.user.companyId);

    // Get all expenses for the company
    const expenses = await Expense.find({ companyId: companyObjectId })
      .populate('employeeId', 'name email')
      .sort({ createdAt: -1 })
      .limit(500); // Limit for performance

    const transformedExpenses = expenses.map((expense: any) => ({
      _id: expense._id,
      merchantName: expense.merchantName || 'N/A',
      description: expense.description || 'N/A',
      date: expense.date,
      category: expense.category || 'N/A',
      amount: expense.amount || 0,
      originalCurrency: expense.originalCurrency || 'USD',
      convertedAmount: expense.convertedAmount || 0,
      status: expense.status || 'PENDING',
      receiptUrl: expense.receiptUrl,
      employeeId: {
        name: expense.employeeId?.name || 'Unknown',
        email: expense.employeeId?.email || 'N/A',
      },
      createdAt: expense.createdAt,
    }));

    return NextResponse.json({
      expenses: transformedExpenses,
      total: expenses.length,
    });
  } catch (error: any) {
    console.error('Admin expenses error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
