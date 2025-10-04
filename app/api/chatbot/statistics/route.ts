
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import Expense from "@/models/Expense";
import User from "@/models/User";
import Company from "@/models/Company";
import dbConnect from "@/lib/mongodb";
import { IExpense } from "@/models/Expense";
import { IUser } from "@/models/User";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  await dbConnect();

  try {
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let stats;
    if (user.role === "ADMIN") {
      stats = await getAdminStats(user.companyId.toString());
    } else if (user.role === "MANAGER") {
      stats = await getManagerStats(userId, user.companyId.toString());
    } else {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

async function getAdminStats(companyId: string) {
  const totalExpenses = await Expense.aggregate([
    { $match: { companyId: companyId } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);

  const expensesByCategory = await Expense.aggregate([
    { $match: { companyId: companyId } },
    { $group: { _id: "$category", total: { $sum: "$amount" } } },
    { $sort: { total: -1 } },
  ]);

  const expensesByStatus = await Expense.aggregate([
    { $match: { companyId: companyId } },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  const totalUsers = await User.countDocuments({ companyId: companyId });

  return {
    totalExpenses: totalExpenses[0]?.total || 0,
    expensesByCategory: expensesByCategory.map((item: { _id: string; total: number }) => ({
      name: item._id,
      value: item.total,
    })),
    expensesByStatus: expensesByStatus.map((item: { _id: string; count: number }) => ({
      name: item._id,
      value: item.count,
    })),
    totalUsers,
  };
}

async function getManagerStats(managerId: string, companyId: string) {
  const teamMembers = await User.find({ managerId: managerId });
  const teamMemberIds = teamMembers.map((user: IUser) => user._id);
  teamMemberIds.push(managerId); // Include manager's own expenses

  const totalTeamExpenses = await Expense.aggregate([
    { $match: { employeeId: { $in: teamMemberIds }, companyId: companyId } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);

  const teamExpensesByCategory = await Expense.aggregate([
    { $match: { employeeId: { $in: teamMemberIds }, companyId: companyId } },
    { $group: { _id: "$category", total: { $sum: "$amount" } } },
    { $sort: { total: -1 } },
  ]);

  const teamExpensesByStatus = await Expense.aggregate([
    { $match: { employeeId: { $in: teamMemberIds }, companyId: companyId } },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  const teamExpensesByUser = await Expense.aggregate([
    { $match: { employeeId: { $in: teamMemberIds }, companyId: companyId } },
    { $group: { _id: "$employeeId", total: { $sum: "$amount" } } },
    { $sort: { total: -1 } },
  ]);

  const users = await User.find({ _id: { $in: teamExpensesByUser.map((item: { _id: string }) => item._id) } }).select('name email');
  const userMap = users.reduce((acc: { [key: string]: string }, user: any) => {
    acc[user._id.toString()] = user.name || user.email;
    return acc;
  }, {});

  return {
    totalTeamExpenses: totalTeamExpenses[0]?.total || 0,
    teamExpensesByCategory: teamExpensesByCategory.map((item: { _id: string; total: number }) => ({
      name: item._id,
      value: item.total,
    })),
    teamExpensesByStatus: teamExpensesByStatus.map((item: { _id: string; count: number }) => ({
      name: item._id,
      value: item.count,
    })),
    teamExpensesByUser: teamExpensesByUser.map((item: { _id: any; total: number }) => ({
      name: userMap[item._id.toString()],
      value: item.total,
    })),
    teamSize: teamMembers.length,
  };
}
