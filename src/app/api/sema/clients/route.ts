import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - List all clients for a user
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

    // Get all clients for this user
    const clients = await prisma.sEMAClient.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            stakeholders: true,
            blockchainLogs: true,
          },
        },
      },
    });

    return NextResponse.json({ clients }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching SEMA clients:', error);
    return NextResponse.json(
      { error: 'Failed to fetch clients', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Create a new client
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      userId: privyUserId, 
      name, 
      description, 
      industry, 
      size, 
      status,
      privacyMode,
      authorizedAuditors 
    } = body;

    if (!privyUserId || !name || !industry || !size) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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

    // Create client
    const client = await prisma.sEMAClient.create({
      data: {
        userId: user.id,
        name,
        description: description || null,
        industry,
        size,
        status: status || 'active',
        privacyMode: privacyMode || false,
        authorizedAuditors: authorizedAuditors || [],
      },
    });

    return NextResponse.json({ client }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating SEMA client:', error);
    return NextResponse.json(
      { error: 'Failed to create client', details: error.message },
      { status: 500 }
    );
  }
}
