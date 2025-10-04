import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/mongodb';
import Company from '@/models/Company';
import { UserRole } from '@/models/User';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function PUT(req: NextRequest) {
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
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const { name, defaultCurrency, country } = await req.json();

    await dbConnect();

    const company = await Company.findByIdAndUpdate(
      session.user.companyId,
      {
        $set: {
          name: name || undefined,
          defaultCurrency: defaultCurrency || undefined,
          country: country || undefined,
        },
      },
      { new: true, runValidators: true }
    );

    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Company updated successfully',
      company: {
        _id: company._id,
        name: company.name,
        defaultCurrency: company.defaultCurrency,
        country: company.country,
      },
    });
  } catch (error: any) {
    console.error('Update company error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
