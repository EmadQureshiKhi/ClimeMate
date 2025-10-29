import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '24h'; // 24h, 7d, 30d, all
    
    let startDate: Date;
    const now = new Date();
    
    switch (period) {
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(0); // All time
    }
    
    // Get aggregate stats
    const stats = await prisma.chargingSession.aggregate({
      where: {
        startTime: {
          gte: startDate,
        },
      },
      _count: {
        sessionId: true,
      },
      _sum: {
        energyUsed: true,
        co2eSaved: true,
        creditsEarned: true,
      },
    });
    
    // Get active sessions count
    const activeSessions = await prisma.chargingSession.count({
      where: {
        status: 'active',
      },
    });
    
    // Get unique stations count
    const uniqueStations = await prisma.chargingSession.findMany({
      where: {
        startTime: {
          gte: startDate,
        },
      },
      select: {
        stationId: true,
      },
      distinct: ['stationId'],
    });
    
    return NextResponse.json({
      success: true,
      period,
      stats: {
        totalSessions: stats._count.sessionId || 0,
        totalEnergy: stats._sum.energyUsed || 0,
        totalCO2e: stats._sum.co2eSaved || 0,
        totalCredits: stats._sum.creditsEarned || 0,
        activeSessions,
        activeStations: uniqueStations.length,
      },
    });
  } catch (error: any) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
