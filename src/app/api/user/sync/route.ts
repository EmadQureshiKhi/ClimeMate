import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { privyId, email, walletAddress, name } = body;

    if (!privyId) {
      return NextResponse.json(
        { error: 'Privy ID is required' },
        { status: 400 }
      );
    }

    // Upsert user (create if doesn't exist, update if exists)
    const user = await prisma.user.upsert({
      where: { privyId },
      update: {
        email,
        walletAddress,
        name,
        updatedAt: new Date(),
      },
      create: {
        privyId,
        email,
        walletAddress,
        name,
      },
    });

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error('Error syncing user:', error);
    return NextResponse.json(
      { error: 'Failed to sync user' },
      { status: 500 }
    );
  }
}
