import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PUT /api/virtual-world/profile/update
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userWallet, avatarType, avatarColor } = body;

    if (!userWallet) {
      return NextResponse.json(
        { error: 'User wallet is required' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (avatarType) updateData.avatarType = avatarType;
    if (avatarColor) updateData.avatarColor = avatarColor;

    const profile = await prisma.virtualProfile.update({
      where: { userWallet },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      profile,
    });
  } catch (error: any) {
    console.error('Error updating virtual profile:', error);
    return NextResponse.json(
      { error: 'Failed to update virtual profile', details: error.message },
      { status: 500 }
    );
  }
}
