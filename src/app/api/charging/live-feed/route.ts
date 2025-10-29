import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const stationId = searchParams.get('stationId');
    
    // Get recent sessions (last 24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const where: any = {
      startTime: {
        gte: twentyFourHoursAgo,
      },
    };
    
    if (stationId) {
      where.stationId = stationId;
    }
    
    const sessions = await prisma.chargingSession.findMany({
      where,
      orderBy: {
        startTime: 'desc',
      },
      take: limit,
      select: {
        sessionId: true,
        userWallet: true,
        stationId: true,
        energyUsed: true,
        co2eSaved: true,
        creditsEarned: true,
        pointsEarned: true,
        startTime: true,
        endTime: true,
        status: true,
      },
    });
    
    // Mark sessions as "live" if they're active and started recently
    const liveSessions = sessions.map(session => ({
      ...session,
      startTime: session.startTime.toISOString(),
      endTime: session.endTime?.toISOString() || null,
      isLive: session.status === 'active' || 
              (session.status === 'completed' && session.endTime &&
               new Date(session.endTime).getTime() > Date.now() - 5 * 60 * 1000), // Completed in last 5 min
    }));
    
    return NextResponse.json({
      success: true,
      sessions: liveSessions,
      count: liveSessions.length,
    });
  } catch (error: any) {
    console.error('Error fetching live feed:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch live feed' },
      { status: 500 }
    );
  }
}
