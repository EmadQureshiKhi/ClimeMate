import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateLevel, getForestLevel } from '@/data/achievements-catalog';

// POST /api/virtual-world/update-on-charge
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userWallet, energyDelivered, co2eSaved } = body;

    if (!userWallet || !energyDelivered || !co2eSaved) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get or create virtual profile
    let profile = await prisma.virtualProfile.findUnique({
      where: { userWallet },
    });

    if (!profile) {
      profile = await prisma.virtualProfile.create({
        data: {
          userWallet,
          avatarType: 'default',
          avatarColor: '#3B82F6',
          level: 1,
          experiencePoints: 0,
          forestLevel: 1,
          treesPlanted: 0,
        },
      });
    }

    // Calculate XP to award (10 XP base + 5 XP per kg CO₂e saved)
    const baseXp = 10;
    const co2eXp = Math.floor(co2eSaved * 5);
    const totalXp = baseXp + co2eXp;

    // Calculate trees to plant (1 tree per kg CO₂e)
    const treesToPlant = Math.floor(co2eSaved);

    // Update profile
    const oldLevel = profile.level;
    const oldForestLevel = profile.forestLevel;
    
    const newXp = profile.experiencePoints + totalXp;
    const newTrees = profile.treesPlanted + treesToPlant;
    const newLevel = calculateLevel(newXp);
    const newForestLevel = getForestLevel(newTrees);

    const updatedProfile = await prisma.virtualProfile.update({
      where: { userWallet },
      data: {
        experiencePoints: newXp,
        level: newLevel,
        treesPlanted: newTrees,
        forestLevel: newForestLevel,
      },
    });

    const leveledUp = newLevel > oldLevel;
    const forestLeveledUp = newForestLevel > oldForestLevel;

    console.log(`🌱 Updated virtual profile for ${userWallet}:`);
    console.log(`   +${totalXp} XP (${baseXp} base + ${co2eXp} CO₂e bonus)`);
    console.log(`   +${treesToPlant} trees`);
    if (leveledUp) console.log(`   🎉 Level up! ${oldLevel} → ${newLevel}`);
    if (forestLeveledUp) console.log(`   🌳 Forest level up! ${oldForestLevel} → ${newForestLevel}`);

    // Check achievements
    const achievementResponse = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/virtual-world/achievements/check`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userWallet }),
      }
    );

    let newAchievements: string[] = [];
    if (achievementResponse.ok) {
      const achievementData = await achievementResponse.json();
      newAchievements = achievementData.newlyCompleted || [];
    }

    return NextResponse.json({
      success: true,
      profile: updatedProfile,
      rewards: {
        xpAwarded: totalXp,
        treesPlanted: treesToPlant,
        leveledUp,
        forestLeveledUp,
        newLevel,
        newForestLevel,
        newAchievements,
      },
    });
  } catch (error: any) {
    console.error('Error updating virtual profile on charge:', error);
    return NextResponse.json(
      { error: 'Failed to update profile', details: error.message },
      { status: 500 }
    );
  }
}
