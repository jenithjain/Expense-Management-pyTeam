import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export enum ApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface IApprovalRequest extends Document {
  expenseId: Types.ObjectId;
  approverId: Types.ObjectId;
  stepNumber: number;
  status: ApprovalStatus;
  comments?: string;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ApprovalRequestSchema = new Schema<IApprovalRequest>(
  {
    expenseId: {
      type: Schema.Types.ObjectId,
      ref: 'Expense',
      required: [true, 'Expense ID is required'],
    },
    approverId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Approver ID is required'],
    },
    stepNumber: {
      type: Number,
      required: [true, 'Step number is required'],
      min: 0,
    },
    status: {
      type: String,
      enum: Object.values(ApprovalStatus),
      default: ApprovalStatus.PENDING,
    },
    comments: {
      type: String,
      trim: true,
    },
    approvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
ApprovalRequestSchema.index({ expenseId: 1 });
ApprovalRequestSchema.index({ approverId: 1, status: 1 });

const ApprovalRequest: Model<IApprovalRequest> = mongoose.models.ApprovalRequest || mongoose.model<IApprovalRequest>('ApprovalRequest', ApprovalRequestSchema);

export default ApprovalRequest;
