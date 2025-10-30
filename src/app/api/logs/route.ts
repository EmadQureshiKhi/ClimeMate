import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Fetch all logs for a user's wallet address
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('walletAddress');

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    console.log('📋 Fetching logs for wallet:', walletAddress);

    // Fetch SEMA blockchain logs
    const semaLogs = await prisma.sEMABlockchainLog.findMany({
      where: {
        userWalletAddress: walletAddress,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    });

    console.log('📊 SEMA logs found:', semaLogs.length);

    // Fetch general audit logs (certificates, uploads, etc.)
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        userWalletAddress: walletAddress,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    });

    console.log('📊 Audit logs found:', auditLogs.length);

    // Combine and sort by date
    const allLogs = [
      ...semaLogs.map(log => ({
        ...log,
        source: 'sema'
      })),
      ...auditLogs.map(log => ({
        ...log,
        source: 'general'
      }))
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 100); // Limit to 100 total

    console.log('📊 Total logs returned:', allLogs.length);

    return NextResponse.json({ logs: allLogs }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch logs', details: error.message },
      { status: 500 }
    );
  }
}
