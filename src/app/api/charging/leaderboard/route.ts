import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'today'; // today, week, month, all
    const limit = parseInt(searchParams.get('limit') || '10');
    
    let startDate: Date;
    const now = new Date();
    
    switch (period) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(0); // All time
    }
    
    // Get leaderboard data grouped by user
    const leaderboard = await prisma.chargingSession.groupBy({
      by: ['userWallet'],
      where: {
        startTime: {
          gte: startDate,
        },
        status: 'completed',
      },
      _count: {
        sessionId: true,
      },
      _sum: {
        energyUsed: true,
        co2eSaved: true,
        creditsEarned: true,
      },
      orderBy: {
        _sum: {
          energyUsed: 'desc',
        },
      },
      take: limit,
    });
    
    // Format leaderboard with ranks
    const formattedLeaderboard = leaderboard.map((entry, index) => ({
      rank: index + 1,
      userWallet: entry.userWallet,
      totalSessions: entry._count.sessionId,
      totalEnergy: entry._sum.energyUsed || 0,
      totalCO2e: entry._sum.co2eSaved || 0,
      totalCredits: entry._sum.creditsEarned || 0,
    }));
    
    return NextResponse.json({
      success: true,
      period,
      leaderboard: formattedLeaderboard,
    });
  } catch (error: any) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}
