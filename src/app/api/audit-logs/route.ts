import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

// GET - Fetch all audit logs for a user's wallet address
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

    // Fetch all audit logs for this wallet address
    const logs = await prisma.auditLog.findMany({
      where: {
        userWalletAddress: walletAddress,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100, // Limit to last 100 logs
    });

    return NextResponse.json({ logs }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch logs', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Create an audit log
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      module,
      action, 
      transactionSignature, 
      details,
      userWalletAddress,
      userId,
      status = 'success',
      error
    } = body;

    console.log('📝 Creating audit log:', { module, action, userWalletAddress });

    if (!module || !action || !userWalletAddress) {
      return NextResponse.json(
        { error: 'Missing required fields: module, action, userWalletAddress' },
        { status: 400 }
      );
    }

    // Create data hash
    const dataHash = crypto.createHash('sha256').update(JSON.stringify(details || {})).digest('hex');

    const log = await prisma.auditLog.create({
      data: {
        module,
        action,
        transactionSignature: transactionSignature || '',
        dataHash,
        details: details || {},
        userWalletAddress,
        userId: userId || null,
        status,
        error: error || null,
      },
    });

    console.log('✅ Audit log created:', log.id);
    return NextResponse.json({ log }, { status: 201 });
  } catch (error: any) {
    console.error('❌ Error creating audit log:', error);
    return NextResponse.json(
      { error: 'Failed to create log', details: error.message },
      { status: 500 }
    );
  }
}
