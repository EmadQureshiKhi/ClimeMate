import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fetchChargingSessions } from '@/lib/decharge-integration';

export async function POST(request: NextRequest) {
  try {
    const { userWallet } = await request.json();

    console.log('🔄 Syncing charging sessions for:', userWallet);

    if (!userWallet) {
      return NextResponse.json(
        { error: 'Wallet address required' },
        { status: 400 }
      );
    }

    // Get user
    const user = await prisma.user.findFirst({
      where: { walletAddress: userWallet },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found. Please connect your wallet first.' },
        { status: 404 }
      );
    }

    // Fetch sessions from DeCharge API (or mock data)
    const sessions = await fetchChargingSessions(userWallet);
    console.log(`📊 Found ${sessions.length} charging sessions`);

    let newSessions = 0;
    let skippedSessions = 0;

    // Process each session
    for (const session of sessions) {
      try {
        // Check if session already exists
        const existing = await prisma.chargingSession.findUnique({
          where: { sessionId: session.sessionId },
        });

        if (existing) {
          console.log(`⏭️  Session ${session.sessionId} already exists`);
          skippedSessions++;
          continue;
        }

        // Create new session
        await prisma.chargingSession.create({
          data: {
            sessionId: session.sessionId,
            userId: user.id,
            userWallet: session.userWallet,
            stationId: session.stationId,
            energyUsed: session.energyUsed,
            co2eSaved: session.co2eSaved,
            creditsEarned: session.creditsEarned,
            pointsEarned: session.pointsEarned,
            startTime: session.startTime,
            endTime: session.endTime,
            cost: session.cost,
            status: session.status,
          },
        });

        newSessions++;
        console.log(`✅ Added session ${session.sessionId}`);
      } catch (sessionError) {
        console.error(`Error processing session ${session.sessionId}:`, sessionError);
      }
    }

    // Update user's charging points total
    if (newSessions > 0) {
      const totalPoints = sessions
        .filter(s => !s.endTime || new Date(s.endTime) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
        .reduce((sum, s) => sum + s.pointsEarned, 0);
      
      await prisma.chargingPoints.upsert({
        where: { userWallet },
        update: {
          points: {
            increment: totalPoints,
          },
          earned: {
            increment: totalPoints,
          },
        },
        create: {
          userId: user.id,
          userWallet,
          points: totalPoints,
          earned: totalPoints,
          spent: 0,
          purchased: 0,
        },
      });

      // Update virtual world (XP, trees, achievements)
      const totalEnergy = sessions.reduce((sum, s) => sum + s.energyUsed, 0);
      const totalCo2e = sessions.reduce((sum, s) => sum + s.co2eSaved, 0);

      let virtualRewards = null;
      try {
        const virtualWorldResponse = await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/virtual-world/update-on-charge`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userWallet,
              energyDelivered: totalEnergy,
              co2eSaved: totalCo2e,
            }),
          }
        );

        if (virtualWorldResponse.ok) {
          const virtualData = await virtualWorldResponse.json();
          virtualRewards = virtualData.rewards;
          console.log(`🌱 Virtual world updated:`, virtualRewards);
        }
      } catch (virtualError) {
        console.error('Error updating virtual world:', virtualError);
        // Don't fail the sync if virtual world update fails
      }

      console.log(`🎉 Sync complete: ${newSessions} new sessions, ${skippedSessions} already synced`);

      return NextResponse.json({
        success: true,
        totalSessions: sessions.length,
        newSessions,
        skippedSessions,
        virtualRewards,
        message: newSessions > 0 
          ? `Synced ${newSessions} new charging sessions` 
          : 'All sessions up to date',
      });
    }

    console.log(`🎉 Sync complete: 0 new sessions, ${skippedSessions} already synced`);

    return NextResponse.json({
      success: true,
      totalSessions: sessions.length,
      newSessions: 0,
      skippedSessions,
      message: 'All sessions up to date',
    });
  } catch (error: any) {
    console.error('Error syncing charging sessions:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to sync charging sessions' },
      { status: 500 }
    );
  }
}
