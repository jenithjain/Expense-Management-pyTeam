import dbConnect from './mongodb';
import ApprovalRequest, { ApprovalStatus } from '@/models/ApprovalRequest';
import Expense, { ExpenseStatus } from '@/models/Expense';
import ApprovalRule, { RuleType } from '@/models/ApprovalRule';
import { Types } from 'mongoose';

/**
 * Initiate approval flow based on rule
 */
export async function initiateApprovalFlow(
  expenseId: string | Types.ObjectId,
  ruleId: string | Types.ObjectId
): Promise<void> {
  await dbConnect();

  const rule = await ApprovalRule.findById(ruleId);
  const expense = await Expense.findById(expenseId);

  if (!rule || !expense) {
    throw new Error('Rule or Expense not found');
  }

  if (!rule.isActive) {
    throw new Error('Approval rule is not active');
  }

  // Check if approval requests already exist
  const existingApprovals = await ApprovalRequest.countDocuments({
    expenseId: expense._id,
  });

  if (existingApprovals > 0) {
    throw new Error('Approval flow already initiated for this expense');
  }

  switch (rule.ruleType) {
    case RuleType.SEQUENTIAL:
      // Create only the first step approval request
      if (rule.approvalSteps.length > 0) {
        const firstStep = rule.approvalSteps.sort((a, b) => a.stepNumber - b.stepNumber)[0];
        
        await ApprovalRequest.create({
          expenseId: expense._id,
          approverId: firstStep.approverId,
          stepNumber: firstStep.stepNumber,
          status: ApprovalStatus.PENDING,
        });

        expense.currentApprovalStep = firstStep.stepNumber;
        await expense.save();
      }
      break;

    case RuleType.PERCENTAGE:
    case RuleType.SPECIFIC_APPROVER:
    case RuleType.HYBRID:
      // Create approval requests for all approvers in the rule
      const approvalPromises = rule.approvalSteps.map((step) =>
        ApprovalRequest.create({
          expenseId: expense._id,
          approverId: step.approverId,
          stepNumber: step.stepNumber,
          status: ApprovalStatus.PENDING,
        })
      );

      await Promise.all(approvalPromises);
      break;

    default:
      throw new Error('Invalid rule type');
  }
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

  // If approved, check if approval is complete
  // First, find the rule being used (if any)
  const allApprovals = await ApprovalRequest.find({
    expenseId: expense._id,
  }).populate('approverId');

  // Try to find the rule (we'll need to determine which rule is being used)
  // For now, we'll check if it's sequential based on step numbers
  const isSequential = allApprovals.some((a) => a.stepNumber > 0);

  if (isSequential) {
    // Sequential flow: create next step if exists
    const currentStep = approvalRequest.stepNumber;
    const nextApproval = await ApprovalRequest.findOne({
      expenseId: expense._id,
      stepNumber: { $gt: currentStep },
    }).sort({ stepNumber: 1 });

    if (nextApproval) {
      // Next step exists, keep expense pending
      expense.currentApprovalStep = nextApproval.stepNumber;
      await expense.save();
      return {
        status: ExpenseStatus.PENDING,
        message: 'Approved. Awaiting next step approval.',
      };
    } else {
      // No more steps, approve the expense
      expense.status = ExpenseStatus.APPROVED;
      await expense.save();
      return {
        status: ExpenseStatus.APPROVED,
        message: 'Expense fully approved',
      };
    }
  } else {
    // Non-sequential: check completion based on all approvals
    const approvedCount = allApprovals.filter(
      (a) => a.status === ApprovalStatus.APPROVED
    ).length;
    const totalCount = allApprovals.length;

    // Simple majority for now (can be enhanced with rule lookup)
    if (approvedCount >= Math.ceil(totalCount / 2)) {
      expense.status = ExpenseStatus.APPROVED;
      await expense.save();
      return {
        status: ExpenseStatus.APPROVED,
        message: 'Expense fully approved',
      };
    } else {
      return {
        status: ExpenseStatus.PENDING,
        message: 'Approved. Awaiting more approvals.',
      };
    }
  }
}

/**
 * Check if approval is complete based on rule
 */
export async function checkApprovalCompletion(
  expenseId: string | Types.ObjectId,
  rule: any
): Promise<boolean> {
  await dbConnect();

  const approvals = await ApprovalRequest.find({
    expenseId,
  });

  switch (rule.ruleType) {
    case RuleType.SEQUENTIAL:
      // Check if last step is approved
      const sortedSteps = rule.approvalSteps.sort(
        (a: any, b: any) => b.stepNumber - a.stepNumber
      );
      const lastStep = sortedSteps[0];

      const lastApproval = approvals.find(
        (a) =>
          a.stepNumber === lastStep.stepNumber &&
          a.approverId.toString() === lastStep.approverId.toString()
      );

      return lastApproval?.status === ApprovalStatus.APPROVED;

    case RuleType.PERCENTAGE:
      // Calculate percentage of approved
      const approvedCount = approvals.filter(
        (a) => a.status === ApprovalStatus.APPROVED
      ).length;
      const percentage = (approvedCount / approvals.length) * 100;

      return percentage >= (rule.percentageRequired || 50);

    case RuleType.SPECIFIC_APPROVER:
      // Check if specific approver approved
      const specificApproval = approvals.find(
        (a) => a.approverId.toString() === rule.specificApproverId.toString()
      );

      return specificApproval?.status === ApprovalStatus.APPROVED;

    case RuleType.HYBRID:
      // Either percentage OR specific approver
      const approvedPercentage =
        (approvals.filter((a) => a.status === ApprovalStatus.APPROVED).length /
          approvals.length) *
        100;

      const specificApproved = approvals.some(
        (a) =>
          a.approverId.toString() === rule.specificApproverId.toString() &&
          a.status === ApprovalStatus.APPROVED
      );

      return (
        approvedPercentage >= (rule.percentageRequired || 50) || specificApproved
      );

    default:
      return false;
  }
}
