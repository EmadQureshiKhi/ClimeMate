import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { allAchievements } from '@/data/achievements-catalog';

// POST /api/virtual-world/achievements/check
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userWallet } = body;

    if (!userWallet) {
      return NextResponse.json(
        { error: 'User wallet is required' },
        { status: 400 }
      );
    }

    // Get user's charging stats
    const sessions = await prisma.chargingSession.findMany({
      where: { userWallet },
    });

    const totalSessions = sessions.length;
    const totalKwh = sessions.reduce((sum, s) => sum + s.energyDelivered, 0);
    const totalCo2e = sessions.reduce((sum, s) => sum + s.co2eSaved, 0);

    // Get user's points
    const pointsRecord = await prisma.chargingPoints.findUnique({
      where: { userWallet },
    });
    const totalPoints = pointsRecord?.earned || 0;

    // Get user's game scores
    const gameScores = await prisma.gameScore.findMany({
      where: { userWallet },
    });
    const totalGames = gameScores.length;

    // Get user's friends
    const friends = await prisma.userFriend.findMany({
      where: {
        userWallet,
        status: 'accepted',
      },
    });
    const totalFriends = friends.length;

    // Get or create user achievements
    let userAchievements = await prisma.userAchievement.findMany({
      where: { userWallet },
    });

    // Initialize achievements if none exist
    if (userAchievements.length === 0) {
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

      userAchievements = await prisma.userAchievement.findMany({
        where: { userWallet },
      });
    }

    const newlyCompleted: string[] = [];
    const updated: string[] = [];

    // Check each achievement
    for (const achievement of allAchievements) {
      const userAchievement = userAchievements.find(
        ua => ua.achievementId === achievement.id
      );

      if (!userAchievement || userAchievement.completed) continue;

      let currentProgress = 0;

      // Calculate progress based on requirement type
      switch (achievement.requirementType) {
        case 'sessions':
          currentProgress = totalSessions;
          break;
        case 'kwh':
          currentProgress = Math.floor(totalKwh);
          break;
        case 'co2e':
          currentProgress = Math.floor(totalCo2e);
          break;
        case 'points':
          currentProgress = totalPoints;
          break;
        case 'friends':
          currentProgress = totalFriends;
          break;
        case 'games':
          currentProgress = totalGames;
          break;
        default:
          currentProgress = 0;
          break;
      }

      // Ensure currentProgress is a valid number
      if (typeof currentProgress !== 'number' || isNaN(currentProgress)) {
        console.warn(`Invalid progress for achievement ${achievement.id}, defaulting to 0`);
        currentProgress = 0;
      }

      // Check if achievement is completed
      const isCompleted = currentProgress >= achievement.requirementValue;
      const isNewlyCompleted = isCompleted && !userAchievement.completed;
      const progressChanged = currentProgress !== userAchievement.progress;

      // Update if progress changed or newly completed
      if (progressChanged || isNewlyCompleted) {
        const updateData: {
          progress: number;
          completed?: boolean;
          completedAt?: Date;
        } = {
          progress: currentProgress, // Now guaranteed to be a valid number
        };

        // Only update completion status if newly completed
        if (isNewlyCompleted) {
          updateData.completed = true;
          updateData.completedAt = new Date();
        }

        await prisma.userAchievement.update({
          where: { id: userAchievement.id },
          data: updateData,
        });

        updated.push(achievement.id);

        if (isNewlyCompleted) {
          newlyCompleted.push(achievement.id);

          // Award XP and points for completing achievement
          const profile = await prisma.virtualProfile.findUnique({
            where: { userWallet },
          });

          if (profile) {
            const newXp = profile.experiencePoints + achievement.rewardXp;
            const newLevel = Math.floor(Math.sqrt(newXp / 50)) + 1;

            await prisma.virtualProfile.update({
              where: { userWallet },
              data: {
                experiencePoints: newXp,
                level: newLevel,
              },
            });
          }

          // Award points
          if (achievement.rewardPoints > 0 && pointsRecord) {
            await prisma.chargingPoints.update({
              where: { userWallet },
              data: {
                points: pointsRecord.points + achievement.rewardPoints,
                earned: pointsRecord.earned + achievement.rewardPoints,
              },
            });
          }

          console.log(`🏆 Achievement unlocked: ${achievement.name} for ${userWallet}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      newlyCompleted,
      updated,
      stats: {
        totalSessions,
        totalKwh: Math.floor(totalKwh),
        totalCo2e: Math.floor(totalCo2e),
        totalPoints,
        totalFriends,
        totalGames,
      },
    });
  } catch (error: any) {
    console.error('Error checking achievements:', error);
    return NextResponse.json(
      { error: 'Failed to check achievements', details: error.message },
      { status: 500 }
    );
  }
}
