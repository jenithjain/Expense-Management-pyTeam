import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IApprover {
  approverId: Types.ObjectId;
  approverName: string;
  stepNumber: number;
  required: boolean;
}

export interface IApprovalRule extends Document {
  companyId: Types.ObjectId;
  category: string;
  minAmount?: number;
  maxAmount?: number;
  approvers: IApprover[];
  requireAllApprovers: boolean;
  minApprovalPercentage?: number;
  specificApproverId?: Types.ObjectId;
  isManagerFirst: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ApproverSchema = new Schema<IApprover>(
  {
    approverId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    approverName: {
      type: String,
      required: true,
    },
    stepNumber: {
      type: Number,
      required: true,
      default: 0,
    },
    required: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false }
);

const ApprovalRuleSchema = new Schema<IApprovalRule>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company ID is required'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    minAmount: {
      type: Number,
      min: 0,
    },
    maxAmount: {
      type: Number,
      min: 0,
    },
    approvers: [ApproverSchema],
    requireAllApprovers: {
      type: Boolean,
      default: true,
    },
    minApprovalPercentage: {
      type: Number,
      min: 0,
      max: 100,
    },
    specificApproverId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    isManagerFirst: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
ApprovalRuleSchema.index({ companyId: 1, category: 1 });

// Clear the model if it exists to force new schema
if (mongoose.models.ApprovalRule) {
  delete mongoose.models.ApprovalRule;
}

const ApprovalRule: Model<IApprovalRule> = mongoose.model<IApprovalRule>('ApprovalRule', ApprovalRuleSchema);

export default ApprovalRule;
