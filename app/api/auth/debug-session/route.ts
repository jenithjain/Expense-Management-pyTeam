import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({
        authenticated: false,
        message: 'No session found',
      });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role,
        companyId: session.user.companyId,
        managerId: session.user.managerId,
      },
      roleType: typeof session.user.role,
      roleLowerCase: session.user.role?.toLowerCase(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Error checking session', details: error.message },
      { status: 500 }
    );
  }
}
