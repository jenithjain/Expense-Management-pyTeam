import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/mongodb';
import Expense, { ExpenseStatus } from '@/models/Expense';
import Company from '@/models/Company';
import User from '@/models/User';
import ApprovalRequest, { ApprovalStatus } from '@/models/ApprovalRequest';
import { convertCurrency } from '@/lib/currency';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const {
      amount,
      originalCurrency,
      category,
      description,
      merchantName,
      date,
      receiptUrl,
      expenseLines,
    } = await req.json();

    // Validate required fields
    if (!amount || !originalCurrency || !category || !description || !merchantName || !date) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Get company's default currency
    const company = await Company.findById(session.user.companyId);
    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    // Convert amount to company's default currency
    let convertedAmount = amount;
    try {
      convertedAmount = await convertCurrency(
        amount,
        originalCurrency,
        company.defaultCurrency
      );
    } catch (error: any) {
      console.error('Currency conversion error:', error);
      return NextResponse.json(
        { error: 'Failed to convert currency', details: error.message },
        { status: 500 }
      );
    }

    // Create expense
    const expense = await Expense.create({
      amount,
      originalCurrency: originalCurrency.toUpperCase(),
      convertedAmount,
      category,
      description,
      merchantName,
      date: new Date(date),
      status: ExpenseStatus.PENDING,
      employeeId: session.user.id,
      companyId: session.user.companyId,
      receiptUrl: receiptUrl || undefined,
      currentApprovalStep: 0,
      expenseLines: expenseLines || [],
    });

    // Check if employee has a manager with isManagerApprover=true
    const employee = await User.findById(session.user.id);
    if (employee?.managerId && employee?.isManagerApprover) {
      const manager = await User.findById(employee.managerId);
      
      if (manager) {
        // Create approval request for the manager
        await ApprovalRequest.create({
          expenseId: expense._id,
          approverId: manager._id,
          stepNumber: 0,
          status: ApprovalStatus.PENDING,
        });
      }
    }
    // If no manager approver, the approval rule flow will be initiated separately

    const populatedExpense = await Expense.findById(expense._id)
      .populate('employeeId', 'name email')
      .populate('companyId', 'name defaultCurrency');

    return NextResponse.json(
      {
        message: 'Expense created successfully',
        expense: populatedExpense,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create expense error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
