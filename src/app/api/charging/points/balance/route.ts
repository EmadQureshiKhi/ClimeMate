import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userWallet = searchParams.get('userWallet');

    if (!userWallet) {
      return NextResponse.json(
        { error: 'Wallet address required' },
        { status: 400 }
      );
    }

    // Get points balance
    const pointsData = await prisma.chargingPoints.findUnique({
      where: { userWallet },
    });

    if (!pointsData) {
      return NextResponse.json({
        success: true,
        balance: {
          available: 0,
          earned: 0,
          spent: 0,
          purchased: 0,
        },
      });
    }

    return NextResponse.json({
      success: true,
      balance: {
        available: pointsData.points,
        earned: pointsData.earned,
        spent: pointsData.spent,
        purchased: pointsData.purchased,
      },
    });
  } catch (error: any) {
    console.error('Error fetching points balance:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch points balance' },
      { status: 500 }
    );
  }
}
