import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateLevel, getForestLevel } from '@/data/achievements-catalog';

// GET /api/virtual-world/profile?userWallet=xxx
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

    // Get or create virtual profile
    let profile = await prisma.virtualProfile.findUnique({
      where: { userWallet },
    });

    if (!profile) {
      // Create profile if it doesn't exist
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

    // Calculate current level based on XP
    const calculatedLevel = calculateLevel(profile.experiencePoints);
    const calculatedForestLevel = getForestLevel(profile.treesPlanted);

    // Update if levels changed
    if (calculatedLevel !== profile.level || calculatedForestLevel !== profile.forestLevel) {
      profile = await prisma.virtualProfile.update({
        where: { userWallet },
        data: {
          level: calculatedLevel,
          forestLevel: calculatedForestLevel,
        },
      });
    }

    return NextResponse.json({
      success: true,
      profile,
    });
  } catch (error: any) {
    console.error('Error fetching virtual profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch virtual profile', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/virtual-world/profile - Create profile
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userWallet, avatarType, avatarColor } = body;

    if (!userWallet) {
      return NextResponse.json(
        { error: 'User wallet is required' },
        { status: 400 }
      );
    }

    // Check if profile already exists
    const existing = await prisma.virtualProfile.findUnique({
      where: { userWallet },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Profile already exists' },
        { status: 400 }
      );
    }

    // Create new profile
    const profile = await prisma.virtualProfile.create({
      data: {
        userWallet,
        avatarType: avatarType || 'default',
        avatarColor: avatarColor || '#3B82F6',
        level: 1,
        experiencePoints: 0,
        forestLevel: 1,
        treesPlanted: 0,
      },
    });

    return NextResponse.json({
      success: true,
      profile,
    });
  } catch (error: any) {
    console.error('Error creating virtual profile:', error);
    return NextResponse.json(
      { error: 'Failed to create virtual profile', details: error.message },
      { status: 500 }
    );
  }
}
