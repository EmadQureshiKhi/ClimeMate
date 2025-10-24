import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - List all internal topics for a client
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

    const topics = await prisma.sEMAInternalTopic.findMany({
      where: { clientId },
      orderBy: { significance: 'desc' },
    });

    return NextResponse.json({ topics }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching internal topics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch internal topics', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Create a new internal topic
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId, ...topicData } = body;

    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      );
    }

    // Calculate significance
    const significance = topicData.severity * topicData.likelihood;
    const isMaterial = significance >= 10;

    const topic = await prisma.sEMAInternalTopic.create({
      data: {
        clientId,
        ...topicData,
        significance,
        isMaterial,
      },
    });

    return NextResponse.json({ topic }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating internal topic:', error);
    return NextResponse.json(
      { error: 'Failed to create internal topic', details: error.message },
      { status: 500 }
    );
  }
}
