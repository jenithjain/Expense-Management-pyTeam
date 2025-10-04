import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  EMPLOYEE = 'EMPLOYEE',
}

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  companyId: Types.ObjectId;
  managerId?: Types.ObjectId;
  isManagerApprover: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.EMPLOYEE,
      required: true,
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company ID is required'],
    },
    managerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    isManagerApprover: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries (email already has unique index from schema)
UserSchema.index({ companyId: 1 });
UserSchema.index({ managerId: 1 });
UserSchema.index({ companyId: 1, role: 1 }); // Compound index for filtering by company and role

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
