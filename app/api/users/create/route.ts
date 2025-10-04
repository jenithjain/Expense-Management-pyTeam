import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import User, { UserRole } from '@/models/User';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userRole = session.user.role?.toUpperCase();
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const { email, password, name, role, managerId, isManagerApprover } = await req.json();

    // Validate input
    if (!email || !password || !name || !role) {
      return NextResponse.json(
        { error: 'Email, password, name, and role are required' },
        { status: 400 }
      );
    }

    // Validate and normalize role
    let normalizedRole: UserRole;
    const lowerRole = role.toLowerCase();
    
    if (lowerRole === 'admin') {
      normalizedRole = UserRole.ADMIN;
    } else if (lowerRole === 'manager') {
      normalizedRole = UserRole.MANAGER;
    } else if (lowerRole === 'employee') {
      normalizedRole = UserRole.EMPLOYEE;
    } else {
      return NextResponse.json(
        { error: 'Invalid role. Must be employee, manager, or admin' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // If managerId is provided, verify it exists in the same company
    if (managerId) {
      const manager = await User.findOne({
        _id: managerId,
        companyId: session.user.companyId,
      });

      if (!manager) {
        return NextResponse.json(
          { error: 'Manager not found in your company' },
          { status: 404 }
        );
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user in admin's company
    const user = await User.create({
      email,
      password: hashedPassword,
      name,
      role: normalizedRole,
      companyId: session.user.companyId,
      managerId: managerId || undefined,
      isManagerApprover: isManagerApprover || false,
    });

    // Remove password from response
    const { password: _, ...userResponse } = user.toObject();

    return NextResponse.json(
      {
        message: 'User created successfully',
        user: userResponse,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
