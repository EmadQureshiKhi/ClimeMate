import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - List all questionnaire responses for a topic
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const topicId = searchParams.get('topicId');

    if (!topicId) {
      return NextResponse.json(
        { error: 'Topic ID is required' },
        { status: 400 }
      );
    }

    const responses = await prisma.sEMAQuestionnaireResponse.findMany({
      where: { topicId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ responses }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching questionnaire responses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch questionnaire responses', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Create a new questionnaire response
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topicId, ...responseData } = body;

    if (!topicId) {
      return NextResponse.json(
        { error: 'Topic ID is required' },
        { status: 400 }
      );
    }

    const response = await prisma.sEMAQuestionnaireResponse.create({
      data: {
        topicId,
        ...responseData,
      },
    });

    // Update the material topic's average score and response count
    const allResponses = await prisma.sEMAQuestionnaireResponse.findMany({
      where: { topicId },
    });

    const averageScore = allResponses.reduce((sum, r) => sum + r.score, 0) / allResponses.length;
    const isMaterial = averageScore >= 7;

    await prisma.sEMAMaterialTopic.update({
      where: { id: topicId },
      data: {
        averageScore,
        responseCount: allResponses.length,
        isMaterial,
      },
    });

    return NextResponse.json({ response }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating questionnaire response:', error);
    return NextResponse.json(
      { error: 'Failed to create questionnaire response', details: error.message },
      { status: 500 }
    );
  }
}
