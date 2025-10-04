import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/mongodb';
import Expense, { ExpenseStatus } from '@/models/Expense';
import ApprovalRequest, { ApprovalStatus } from '@/models/ApprovalRequest';
import User, { UserRole } from '@/models/User';
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

    // Find all users where managerId equals current user
    const teamMembers = await User.find({
      managerId: session.user.id,
      companyId: session.user.companyId,
    }).select('_id name email');

    const teamMemberIds = teamMembers.map((member) => member._id);

    // Count pending approval requests for manager
    const pendingApprovals = await ApprovalRequest.countDocuments({
      approverId: session.user.id,
      status: ApprovalStatus.PENDING,
    });

    // Count team's total expenses
    const totalTeamExpenses = await Expense.countDocuments({
      employeeId: { $in: teamMemberIds },
    });

    // Count team's approved expenses
    const approvedTeamExpenses = await Expense.countDocuments({
      employeeId: { $in: teamMemberIds },
      status: ExpenseStatus.APPROVED,
    });

    // Aggregate team spending by category
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

    // Total team spending
    const totalTeamSpending = teamSpendingByCategory.reduce(
      (sum, cat) => sum + cat.total,
      0
    );

    return NextResponse.json({
      statistics: {
        teamMemberCount: teamMembers.length,
        pendingApprovals,
        totalTeamExpenses,
        approvedTeamExpenses,
        totalTeamSpending,
      },
      teamSpendingByCategory,
      teamMembers: teamMembers.map((member) => ({
        id: member._id,
        name: member.name,
        email: member.email,
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
