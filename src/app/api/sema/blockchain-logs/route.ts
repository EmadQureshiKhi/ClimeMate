import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Get blockchain logs for a client
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      );
    }

    const logs = await prisma.sEMABlockchainLog.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ logs }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching blockchain logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch logs', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Create a blockchain log
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId, action, dataHash, transactionSignature, status, error, metadata } = body;

    if (!clientId || !action || !dataHash) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const log = await prisma.sEMABlockchainLog.create({
      data: {
        clientId,
        action,
        dataHash,
        transactionSignature: transactionSignature || null,
        status: status || 'pending',
        error: error || null,
        metadata: metadata || null,
      },
    });

    return NextResponse.json({ log }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating blockchain log:', error);
    return NextResponse.json(
      { error: 'Failed to create log', details: error.message },
      { status: 500 }
    );
  }
}

// PATCH - Update a blockchain log (for updating status after transaction)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, transactionSignature, status, error } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Log ID is required' },
        { status: 400 }
      );
    }

    const log = await prisma.sEMABlockchainLog.update({
      where: { id },
      data: {
        transactionSignature: transactionSignature || undefined,
        status: status || undefined,
        error: error || undefined,
      },
    });

    return NextResponse.json({ log }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating blockchain log:', error);
    return NextResponse.json(
      { error: 'Failed to update log', details: error.message },
      { status: 500 }
    );
  }
}
