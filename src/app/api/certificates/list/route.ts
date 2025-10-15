import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const privyUserId = searchParams.get('userId');

    if (!privyUserId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Look up user by Privy ID to get database ID
    const user = await prisma.user.findUnique({
      where: { privyId: privyUserId },
    });

    if (!user) {
      // User not found, return empty list
      return NextResponse.json({ certificates: [] }, { status: 200 });
    }

    // Get user's certificates
    const certificates = await prisma.certificate.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ certificates }, { status: 200 });
  } catch (error) {
    console.error('Error fetching certificates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch certificates' },
      { status: 500 }
    );
  }
}
