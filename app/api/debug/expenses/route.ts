import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/mongodb';
import Expense from '@/models/Expense';
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

    await dbConnect();

    // Get all expenses without filtering
    const allExpenses = await Expense.find({}).limit(10);

    // Get expenses for current user (string comparison)
    const myExpensesString = await Expense.find({
      employeeId: session.user.id,
    }).limit(10);

    // Check if any expenses exist
    const totalCount = await Expense.countDocuments({});

    return NextResponse.json({
      debug: {
        sessionUserId: session.user.id,
        sessionUserIdType: typeof session.user.id,
        totalExpensesInDb: totalCount,
        allExpensesSample: allExpenses.map((e: any) => ({
          _id: e._id,
          employeeId: e.employeeId,
          employeeIdType: typeof e.employeeId,
          merchantName: e.merchantName,
          amount: e.amount,
        })),
        myExpensesString: myExpensesString.map((e: any) => ({
          _id: e._id,
          employeeId: e.employeeId,
          merchantName: e.merchantName,
        })),
      },
    });
  } catch (error: any) {
    console.error('Debug expenses error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
