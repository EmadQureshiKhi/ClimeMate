import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userWallet = searchParams.get('userWallet');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!userWallet) {
      return NextResponse.json(
        { error: 'Wallet address required' },
        { status: 400 }
      );
    }

    // Get redemption history
    const redemptions = await prisma.pointsRedemption.findMany({
      where: { userWallet },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return NextResponse.json({
      success: true,
      redemptions: redemptions.map(r => ({
        id: r.id,
        rewardName: r.rewardName,
        rewardCategory: r.rewardCategory,
        pointsCost: r.pointsCost,
        redemptionCode: r.redemptionCode,
        status: r.status,
        expiresAt: r.expiresAt,
        createdAt: r.createdAt,
      })),
      count: redemptions.length,
    });
  } catch (error: any) {
    console.error('Error fetching redemption history:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch redemption history' },
      { status: 500 }
    );
  }
}
