import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateLevel } from '@/data/achievements-catalog';

// POST /api/virtual-world/profile/award-xp
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userWallet, xpAmount, reason } = body;

    if (!userWallet || !xpAmount) {
      return NextResponse.json(
        { error: 'User wallet and XP amount are required' },
        { status: 400 }
      );
    }

    // Get current profile
    const profile = await prisma.virtualProfile.findUnique({
      where: { userWallet },
    });

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    const oldLevel = profile.level;
    const newXp = profile.experiencePoints + xpAmount;
    const newLevel = calculateLevel(newXp);
    const leveledUp = newLevel > oldLevel;

    // Update profile
    const updatedProfile = await prisma.virtualProfile.update({
      where: { userWallet },
      data: {
        experiencePoints: newXp,
        level: newLevel,
      },
    });

    console.log(`Awarded ${xpAmount} XP to ${userWallet} for: ${reason}`);
    if (leveledUp) {
      console.log(`🎉 User leveled up from ${oldLevel} to ${newLevel}!`);
    }

    return NextResponse.json({
      success: true,
      newXp,
      newLevel,
      leveledUp,
      oldLevel,
      profile: updatedProfile,
    });
  } catch (error: any) {
    console.error('Error awarding XP:', error);
    return NextResponse.json(
      { error: 'Failed to award XP', details: error.message },
      { status: 500 }
    );
  }
}
