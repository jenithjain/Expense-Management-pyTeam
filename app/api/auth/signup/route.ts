import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import User, { UserRole } from '@/models/User';
import Company from '@/models/Company';
import axios from 'axios';

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, countryCode } = await req.json();

    // Validate input
    if (!email || !password || !name || !countryCode) {
      return NextResponse.json(
        { error: 'Email, password, name, and country code are required' },
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

    // Fetch currency from countries API
    let defaultCurrency = 'USD'; // fallback
    let countryName = countryCode;

    try {
      const response = await axios.get(
        `https://restcountries.com/v3.1/alpha/${countryCode}?fields=name,currencies`
      );
      
      if (response.data && response.data.currencies) {
        // Get the first currency code
        const currencies = Object.keys(response.data.currencies);
        if (currencies.length > 0) {
          defaultCurrency = currencies[0];
        }
      }

      if (response.data && response.data.name) {
        countryName = response.data.name.common || countryCode;
      }
    } catch (error) {
      console.error('Error fetching country data:', error);
      // Continue with fallback values
    }

    // Create company
    const company = await Company.create({
      name: `${name}'s Company`,
      defaultCurrency,
      country: countryName,
    });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin user
    const user = await User.create({
      email,
      password: hashedPassword,
      name,
      role: UserRole.ADMIN,
      companyId: company._id,
      isManagerApprover: false,
    });

    return NextResponse.json(
      {
        message: 'User and company created successfully',
        userId: user._id,
        companyId: company._id,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
