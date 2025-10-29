import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { allAchievements } from '@/data/achievements-catalog';

// GET /api/virtual-world/achievements/user?userWallet=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userWallet = searchParams.get('userWallet');

    if (!userWallet) {
      return NextResponse.json(
        { error: 'User wallet is required' },
        { status: 400 }
      );
    }

    // Get user's achievement progress
    const userAchievements = await prisma.userAchievement.findMany({
      where: { userWallet },
      include: {
        achievement: true,
      },
    });

    // If user has no achievements yet, initialize them
    if (userAchievements.length === 0) {
      // Create achievement records for all achievements
      const achievementRecords = allAchievements.map(achievement => ({
        userWallet,
        achievementId: achievement.id,
        progress: 0,
        completed: false,
      }));

      await prisma.userAchievement.createMany({
        data: achievementRecords,
        skipDuplicates: true,
      });

      // Fetch again
      const newUserAchievements = await prisma.userAchievement.findMany({
        where: { userWallet },
        include: {
          achievement: true,
        },
      });

      return NextResponse.json({
        success: true,
        achievements: newUserAchievements,
      });
    }

    return NextResponse.json({
      success: true,
      achievements: userAchievements,
    });
  } catch (error: any) {
    console.error('Error fetching user achievements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch achievements', details: error.message },
      { status: 500 }
    );
  }
}
