import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { extractReceiptData } from '@/lib/ocr';
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

    const { imageUrl } = await req.json();

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }

    // Extract receipt data using OCR
    const extractedData = await extractReceiptData(imageUrl);

    return NextResponse.json({
      message: 'Receipt scanned successfully. Please review and confirm the data.',
      data: extractedData,
    });
  } catch (error: any) {
    console.error('OCR scan error:', error);
    return NextResponse.json(
      { error: 'Failed to scan receipt', details: error.message },
      { status: 500 }
    );
  }
}
