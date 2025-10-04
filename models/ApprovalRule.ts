import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export enum RuleType {
  SEQUENTIAL = 'SEQUENTIAL',
  PERCENTAGE = 'PERCENTAGE',
  SPECIFIC_APPROVER = 'SPECIFIC_APPROVER',
  HYBRID = 'HYBRID',
}

export interface IApprovalStep {
  stepNumber: number;
  approverId: Types.ObjectId;
  isRequired: boolean;
}

export interface IApprovalRule extends Document {
  companyId: Types.ObjectId;
  name: string;
  ruleType: RuleType;
  percentageRequired?: number;
  specificApproverId?: Types.ObjectId;
  approvalSteps: IApprovalStep[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ApprovalStepSchema = new Schema<IApprovalStep>(
  {
    stepNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    approverId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isRequired: {
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
    name: {
      type: String,
      required: [true, 'Rule name is required'],
      trim: true,
    },
    ruleType: {
      type: String,
      enum: Object.values(RuleType),
      required: [true, 'Rule type is required'],
    },
    percentageRequired: {
      type: Number,
      min: 0,
      max: 100,
    },
    specificApproverId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    approvalSteps: {
      type: [ApprovalStepSchema],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
ApprovalRuleSchema.index({ companyId: 1, isActive: 1 });

const ApprovalRule: Model<IApprovalRule> = mongoose.models.ApprovalRule || mongoose.model<IApprovalRule>('ApprovalRule', ApprovalRuleSchema);

export default ApprovalRule;
