import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/mongodb';
import Expense, { ExpenseStatus } from '@/models/Expense';
import ApprovalRequest, { ApprovalStatus } from '@/models/ApprovalRequest';
import User, { UserRole } from '@/models/User';
import Company from '@/models/Company';
import mongoose from 'mongoose';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Allow both manager and admin roles
    const allowedRoles = ['manager', 'admin', 'MANAGER', 'ADMIN'];
    if (!session || !allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized. Manager access required.' },
        { status: 403 }
      );
    }

    await dbConnect();

    const managerObjectId = new mongoose.Types.ObjectId(session.user.id);

    // Get company for currency
    const company = await Company.findById(session.user.companyId);
    const currency = company?.defaultCurrency || 'USD';

    // Count pending approval requests for this manager
    const pendingApprovals = await ApprovalRequest.countDocuments({
      approverId: managerObjectId,
      status: ApprovalStatus.PENDING,
    });

    // Calculate total pending amount for this manager's approval requests
    const pendingApprovalRequests = await ApprovalRequest.find({
      approverId: managerObjectId,
      status: ApprovalStatus.PENDING,
    }).populate('expenseId');

    const pendingAmount = pendingApprovalRequests.reduce((sum, req: any) => {
      return sum + (req.expenseId?.convertedAmount || 0);
    }, 0);

    // Get current month start
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Count approved this month
    const approvedThisMonth = await ApprovalRequest.countDocuments({
      approverId: managerObjectId,
      status: ApprovalStatus.APPROVED,
      approvedAt: { $gte: monthStart },
    });

    // Count rejected this month
    const rejectedThisMonth = await ApprovalRequest.countDocuments({
      approverId: managerObjectId,
      status: ApprovalStatus.REJECTED,
      approvedAt: { $gte: monthStart },
    });

    // Total approved (all time)
    const totalApproved = await ApprovalRequest.countDocuments({
      approverId: managerObjectId,
      status: ApprovalStatus.APPROVED,
    });

    // Total rejected (all time)
    const totalRejected = await ApprovalRequest.countDocuments({
      approverId: managerObjectId,
      status: ApprovalStatus.REJECTED,
    });

    // Get recent approvals (last 10)
    const recentApprovals = await ApprovalRequest.find({
      approverId: managerObjectId,
      status: { $in: [ApprovalStatus.APPROVED, ApprovalStatus.REJECTED] },
    })
      .populate({
        path: 'expenseId',
        populate: {
          path: 'employeeId',
          select: 'name email',
        },
      })
      .sort({ approvedAt: -1 })
      .limit(10);

    // Transform recent approvals
    const formattedRecentApprovals = recentApprovals
      .filter((approval: any) => approval.expenseId)
      .map((approval: any) => ({
        _id: approval._id,
        expense: {
          merchantName: approval.expenseId.merchantName,
          amount: approval.expenseId.amount,
          originalCurrency: approval.expenseId.originalCurrency,
          employee: {
            name: approval.expenseId.employeeId?.name || 'Unknown',
          },
        },
        status: approval.status,
        createdAt: approval.createdAt,
      }));

    // Find team members (users where managerId equals current user)
    const teamMembers = await User.find({
      managerId: managerObjectId,
    }).select('_id name email role');

    const teamMemberIds = teamMembers.map((member) => member._id);

    // Get team expenses statistics
    const totalTeamExpenses = await Expense.countDocuments({
      employeeId: { $in: teamMemberIds },
    });

    const pendingTeamExpenses = await Expense.countDocuments({
      employeeId: { $in: teamMemberIds },
      status: ExpenseStatus.PENDING,
    });

    const approvedTeamExpenses = await Expense.countDocuments({
      employeeId: { $in: teamMemberIds },
      status: ExpenseStatus.APPROVED,
    });

    // Calculate team spending
    const teamSpendingResult = await Expense.aggregate([
      {
        $match: {
          employeeId: { $in: teamMemberIds },
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

    const totalTeamSpending = teamSpendingResult[0]?.total || 0;

    // Team spending by category
    const teamSpendingByCategory = await Expense.aggregate([
      {
        $match: {
          employeeId: { $in: teamMemberIds },
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
      // Approval statistics
      pendingApprovals,
      approvedThisMonth,
      rejectedThisMonth,
      totalApproved,
      totalRejected,
      pendingAmount,
      currency,
      recentApprovals: formattedRecentApprovals,
      
      // Team statistics
      teamStatistics: {
        teamMemberCount: teamMembers.length,
        totalTeamExpenses,
        pendingTeamExpenses,
        approvedTeamExpenses,
        totalTeamSpending,
      },
      teamSpendingByCategory,
      teamMembers: teamMembers.map((member) => ({
        id: member._id,
        name: member.name,
        email: member.email,
        role: member.role,
      })),
    });
  } catch (error: any) {
    console.error('Manager dashboard error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

