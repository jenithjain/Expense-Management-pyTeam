import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IApprovalRule extends Document {
  companyId: Types.ObjectId;
  category: string;
  minAmount?: number;
  maxAmount?: number;
  approvers: Types.ObjectId[];
  requireAllApprovers: boolean;
  minApprovalPercentage?: number;
  specificApproverId?: Types.ObjectId;
  isManagerFirst: boolean;
  createdAt: Date;
  updatedAt: Date;
}

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
    approvers: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
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

const ApprovalRule: Model<IApprovalRule> = mongoose.models.ApprovalRule || mongoose.model<IApprovalRule>('ApprovalRule', ApprovalRuleSchema);

export default ApprovalRule;
