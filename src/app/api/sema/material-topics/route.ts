import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - List all material topics for a client
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

    const topics = await prisma.sEMAMaterialTopic.findMany({
      where: { clientId },
      orderBy: { averageScore: 'desc' },
    });

    return NextResponse.json({ topics }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching material topics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch material topics', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Create a new material topic
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

    const topic = await prisma.sEMAMaterialTopic.create({
      data: {
        clientId,
        ...topicData,
      },
    });

    return NextResponse.json({ topic }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating material topic:', error);
    return NextResponse.json(
      { error: 'Failed to create material topic', details: error.message },
      { status: 500 }
    );
  }
}
