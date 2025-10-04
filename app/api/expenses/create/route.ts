import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/mongodb';
import Expense, { ExpenseStatus } from '@/models/Expense';
import Company from '@/models/Company';
import { convertCurrency } from '@/lib/currency';
import { initiateApprovalFlow } from '@/lib/approval-engine';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import mongoose from 'mongoose';

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
      employeeId: new mongoose.Types.ObjectId(session.user.id),
      companyId: new mongoose.Types.ObjectId(session.user.companyId),
      receiptUrl: receiptUrl || undefined,
      currentApprovalStep: 0,
      expenseLines: expenseLines || [],
    });

    // Initiate approval flow
    try {
      await initiateApprovalFlow((expense as any)._id.toString(), session.user.id);
    } catch (error: any) {
      console.error('Approval flow error:', error);
      // Continue even if approval flow fails - expense is created
    }

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

