import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRewardById, generateRedemptionCode } from '@/data/rewards-catalog';

export async function POST(request: NextRequest) {
  try {
    const { userWallet, rewardId } = await request.json();

    if (!userWallet || !rewardId) {
      return NextResponse.json(
        { error: 'Wallet address and reward ID required' },
        { status: 400 }
      );
    }

    // Get reward details
    const reward = getRewardById(rewardId);
    if (!reward) {
      return NextResponse.json(
        { error: 'Reward not found' },
        { status: 404 }
      );
    }

    if (!reward.available) {
      return NextResponse.json(
        { error: 'Reward is currently unavailable' },
        { status: 400 }
      );
    }

    // Get user
    const user = await prisma.user.findFirst({
      where: { walletAddress: userWallet },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get points balance
    const pointsData = await prisma.chargingPoints.findUnique({
      where: { userWallet },
    });

    if (!pointsData || pointsData.points < reward.pointsCost) {
      return NextResponse.json(
        { error: 'Insufficient points' },
        { status: 400 }
      );
    }

    // Generate redemption code
    const redemptionCode = generateRedemptionCode(reward.id);

    // Calculate expiry date
    const expiresAt = reward.expiryDays
      ? new Date(Date.now() + reward.expiryDays * 24 * 60 * 60 * 1000)
      : null;

    // Create redemption record and update points in a transaction
    const [redemption, updatedPoints] = await prisma.$transaction([
      prisma.pointsRedemption.create({
        data: {
          userId: user.id,
          userWallet,
          rewardId: reward.id,
          rewardName: reward.name,
          rewardCategory: reward.category,
          pointsCost: reward.pointsCost,
          redemptionCode,
          status: 'completed',
          expiresAt,
        },
      }),
      prisma.chargingPoints.update({
        where: { userWallet },
        data: {
          points: {
            decrement: reward.pointsCost,
          },
          spent: {
            increment: reward.pointsCost,
          },
        },
      }),
    ]);

    console.log(`✅ Redeemed ${reward.name} for ${reward.pointsCost} points`);
    console.log(`📝 Redemption code: ${redemptionCode}`);

    return NextResponse.json({
      success: true,
      redemption: {
        id: redemption.id,
        rewardName: redemption.rewardName,
        rewardCategory: redemption.rewardCategory,
        pointsCost: redemption.pointsCost,
        redemptionCode: redemption.redemptionCode,
        expiresAt: redemption.expiresAt,
        status: redemption.status,
        createdAt: redemption.createdAt,
      },
      newBalance: updatedPoints.points,
    });
  } catch (error: any) {
    console.error('Error redeeming points:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to redeem points' },
      { status: 500 }
    );
  }
}
