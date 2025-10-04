import dbConnect from './mongodb';
import ApprovalRequest, { ApprovalStatus } from '@/models/ApprovalRequest';
import Expense, { ExpenseStatus } from '@/models/Expense';
import ApprovalRule from '@/models/ApprovalRule';
import User from '@/models/User';
import { Types } from 'mongoose';

/**
 * Find matching approval rule for an expense
 */
export async function findMatchingRule(
  companyId: string | Types.ObjectId,
  category: string,
  amount: number
): Promise<any | null> {
  await dbConnect();

  const rules = await ApprovalRule.find({
    companyId,
    category,
  });

  // Filter rules by amount range
  const matchingRule = rules.find((rule) => {
    const minMatch = !rule.minAmount || amount >= rule.minAmount;
    const maxMatch = !rule.maxAmount || amount <= rule.maxAmount;
    return minMatch && maxMatch;
  });

  return matchingRule || null;
}

/**
 * Initiate approval flow for an expense
 */
export async function initiateApprovalFlow(
  expenseId: string | Types.ObjectId,
  employeeId: string | Types.ObjectId
): Promise<void> {
  await dbConnect();

  const expense = await Expense.findById(expenseId);
  if (!expense) {
    throw new Error('Expense not found');
  }

  // Check if approval requests already exist
  const existingApprovals = await ApprovalRequest.countDocuments({
    expenseId: expense._id,
  });

  if (existingApprovals > 0) {
    throw new Error('Approval flow already initiated for this expense');
  }

  // Find matching rule
  const rule = await findMatchingRule(
    expense.companyId,
    expense.category,
    expense.convertedAmount
  );

  if (!rule) {
    // No rule found - auto-approve or require default approval
    expense.status = ExpenseStatus.APPROVED;
    await expense.save();
    return;
  }

  // Get employee info
  const employee = await User.findById(employeeId).populate('managerId');

  // Create approval requests based on rule
  let stepNumber = 0;

  // If isManagerFirst, create manager approval first
  if (rule.isManagerFirst && employee?.managerId) {
    const manager = employee.managerId as any;
    
    if (manager.isManagerApprover) {
      await ApprovalRequest.create({
        expenseId: expense._id,
        approverId: manager._id,
        stepNumber,
        status: ApprovalStatus.PENDING,
      });
      stepNumber++;
    }
  }

  // Create approval requests for all approvers in the rule (sequential)
  for (const approverId of rule.approvers) {
    await ApprovalRequest.create({
      expenseId: expense._id,
      approverId,
      stepNumber,
      status: ApprovalStatus.PENDING,
    });
    stepNumber++;
  }

  expense.currentApprovalStep = 0;
  await expense.save();
}

/**
 * Process an approval (approve or reject)
 */
export async function processApproval(
  approvalRequestId: string | Types.ObjectId,
  action: 'APPROVE' | 'REJECT',
  comments?: string
): Promise<{ status: ExpenseStatus; message: string }> {
  await dbConnect();

  const approvalRequest = await ApprovalRequest.findById(approvalRequestId);

  if (!approvalRequest) {
    throw new Error('Approval request not found');
  }

  if (approvalRequest.status !== ApprovalStatus.PENDING) {
    throw new Error('Approval request already processed');
  }

  const expense = await Expense.findById(approvalRequest.expenseId);

  if (!expense) {
    throw new Error('Expense not found');
  }

  // Update approval request
  approvalRequest.status =
    action === 'APPROVE' ? ApprovalStatus.APPROVED : ApprovalStatus.REJECTED;
  approvalRequest.comments = comments;
  approvalRequest.approvedAt = new Date();
  await approvalRequest.save();

  // If rejected, reject the expense and stop
  if (action === 'REJECT') {
    expense.status = ExpenseStatus.REJECTED;
    await expense.save();
    return {
      status: ExpenseStatus.REJECTED,
      message: 'Expense rejected',
    };
  }

  // Get all approval requests for this expense
  const allApprovals = await ApprovalRequest.find({
    expenseId: expense._id,
  }).sort({ stepNumber: 1 });

  // Find the matching rule
  const rule = await findMatchingRule(
    expense.companyId,
    expense.category,
    expense.convertedAmount
  );

  if (!rule) {
    // No rule - approve immediately
    expense.status = ExpenseStatus.APPROVED;
    await expense.save();
    return {
      status: ExpenseStatus.APPROVED,
      message: 'Expense fully approved',
    };
  }

  // Check if specific approver approved (auto-approve condition)
  if (rule.specificApproverId) {
    const specificApproval = allApprovals.find(
      (a) => a.approverId.toString() === rule.specificApproverId.toString()
    );

    if (specificApproval?.status === ApprovalStatus.APPROVED) {
      expense.status = ExpenseStatus.APPROVED;
      await expense.save();
      return {
        status: ExpenseStatus.APPROVED,
        message: 'Expense auto-approved by specific approver',
      };
    }
  }

  // Check percentage-based approval
  if (rule.minApprovalPercentage) {
    const approvedCount = allApprovals.filter(
      (a) => a.status === ApprovalStatus.APPROVED
    ).length;
    const percentage = (approvedCount / allApprovals.length) * 100;

    if (percentage >= rule.minApprovalPercentage) {
      expense.status = ExpenseStatus.APPROVED;
      await expense.save();
      return {
        status: ExpenseStatus.APPROVED,
        message: `Expense approved (${percentage.toFixed(0)}% approval reached)`,
      };
    }
  }

  // Check if all approvers approved (sequential or require all)
  if (rule.requireAllApprovers) {
    const allApproved = allApprovals.every(
      (a) => a.status === ApprovalStatus.APPROVED
    );

    if (allApproved) {
      expense.status = ExpenseStatus.APPROVED;
      await expense.save();
      return {
        status: ExpenseStatus.APPROVED,
        message: 'Expense fully approved',
      };
    }
  }

  // Update current approval step
  const nextPending = allApprovals.find((a) => a.status === ApprovalStatus.PENDING);
  if (nextPending) {
    expense.currentApprovalStep = nextPending.stepNumber;
    await expense.save();
  }

  return {
    status: ExpenseStatus.PENDING,
    message: 'Approved. Awaiting additional approvals.',
  };
}
