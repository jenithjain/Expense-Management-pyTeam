import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export enum ExpenseStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface IExpenseLine {
  description: string;
  amount: number;
  quantity: number;
}

export interface IExpense extends Document {
  amount: number;
  originalCurrency: string;
  convertedAmount: number;
  category: string;
  description: string;
  merchantName: string;
  date: Date;
  status: ExpenseStatus;
  employeeId: Types.ObjectId;
  companyId: Types.ObjectId;
  receiptUrl?: string;
  currentApprovalStep: number;
  expenseLines: IExpenseLine[];
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseLineSchema = new Schema<IExpenseLine>(
  {
    description: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
  },
  { _id: false }
);

const ExpenseSchema = new Schema<IExpense>(
  {
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount must be positive'],
    },
    originalCurrency: {
      type: String,
      required: [true, 'Original currency is required'],
      uppercase: true,
      trim: true,
    },
    convertedAmount: {
      type: Number,
      required: [true, 'Converted amount is required'],
      min: 0,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    merchantName: {
      type: String,
      required: [true, 'Merchant name is required'],
      trim: true,
    },
    date: {
      type: Date,
      required: [true, 'Expense date is required'],
    },
    status: {
      type: String,
      enum: Object.values(ExpenseStatus),
      default: ExpenseStatus.PENDING,
    },
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Employee ID is required'],
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company ID is required'],
    },
    receiptUrl: {
      type: String,
      trim: true,
    },
    currentApprovalStep: {
      type: Number,
      default: 0,
    },
    expenseLines: {
      type: [ExpenseLineSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
ExpenseSchema.index({ employeeId: 1, createdAt: -1 });
ExpenseSchema.index({ companyId: 1, status: 1 });
ExpenseSchema.index({ status: 1 });

const Expense: Model<IExpense> = mongoose.models.Expense || mongoose.model<IExpense>('Expense', ExpenseSchema);

export default Expense;
