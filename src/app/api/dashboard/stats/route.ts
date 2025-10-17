import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const privyUserId = searchParams.get('userId');

    if (!privyUserId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Look up user by Privy ID
    const user = await prisma.user.findUnique({
      where: { privyId: privyUserId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Fetch user's certificates
    const certificates = await prisma.certificate.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Fetch user's emission data
    const emissionData = await prisma.emissionData.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Fetch user's carbon credits
    const carbonCredits = await prisma.carbonCredit.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Calculate stats
    const totalEmissions = certificates.reduce((sum, cert) => sum + cert.totalEmissions, 0);
    const totalOffsets = carbonCredits.reduce((sum, credit) => sum + credit.amount, 0);
    const certificateCount = certificates.length;
    const transactionCount = carbonCredits.length;

    // Build recent activity
    const recentActivity = [
      ...certificates.map(cert => ({
        id: cert.id,
        type: 'certificate',
        title: 'Certificate Generated',
        description: cert.title,
        timestamp: cert.createdAt.toISOString(),
        status: 'completed',
        amount: cert.totalEmissions,
        txHash: cert.blockchainTx || undefined,
      })),
      ...carbonCredits.map(credit => ({
        id: credit.id,
        type: 'purchase',
        title: 'Carbon Credits Purchased',
        description: credit.projectTitle,
        timestamp: credit.createdAt.toISOString(),
        status: 'completed',
        amount: credit.amount,
        txHash: credit.transactionHash || undefined,
      })),
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);

    // Build emissions chart data (last 6 months)
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const monthCerts = certificates.filter(cert => {
        const certDate = new Date(cert.createdAt);
        return certDate >= monthStart && certDate <= monthEnd;
      });

      const monthCredits = carbonCredits.filter(credit => {
        const creditDate = new Date(credit.createdAt);
        return creditDate >= monthStart && creditDate <= monthEnd;
      });

      const emissions = monthCerts.reduce((sum, cert) => sum + cert.totalEmissions, 0);
      const offsets = monthCredits.reduce((sum, credit) => sum + credit.amount, 0);

      monthlyData.push({
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        emissions: Math.round(emissions),
        offsets: Math.round(offsets),
        net: Math.round(emissions - offsets),
      });
    }

    const response = {
      stats: {
        totalEmissions: Math.round(totalEmissions),
        offsetCredits: Math.round(totalOffsets),
        certificates: certificateCount,
        marketplaceTransactions: transactionCount,
        emissionsChange: 0, // Calculate based on previous period if needed
        offsetsChange: 0, // Calculate based on previous period if needed
      },
      emissions: monthlyData,
      recentActivity,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error: any) {
    console.error('❌ Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats', details: error.message },
      { status: 500 }
    );
  }
}
