import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - List all stakeholders for a client
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

    const stakeholders = await prisma.sEMAStakeholder.findMany({
      where: { clientId },
      orderBy: { totalScore: 'desc' },
    });

    return NextResponse.json({ stakeholders }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching stakeholders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stakeholders', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Create a new stakeholder
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId, ...stakeholderData } = body;

    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      );
    }

    // Transform snake_case to camelCase for Prisma
    const transformedData = {
      name: stakeholderData.name,
      category: stakeholderData.category,
      stakeholderType: stakeholderData.stakeholder_type || stakeholderData.stakeholderType,
      dependencyEconomic: stakeholderData.dependency_economic || stakeholderData.dependencyEconomic,
      dependencySocial: stakeholderData.dependency_social || stakeholderData.dependencySocial,
      dependencyEnvironmental: stakeholderData.dependency_environmental || stakeholderData.dependencyEnvironmental,
      influenceEconomic: stakeholderData.influence_economic || stakeholderData.influenceEconomic,
      influenceSocial: stakeholderData.influence_social || stakeholderData.influenceSocial,
      influenceEnvironmental: stakeholderData.influence_environmental || stakeholderData.influenceEnvironmental,
      populationSize: stakeholderData.population_size || stakeholderData.populationSize || 0,
    };

    // Calculate scores
    const totalScore = 
      transformedData.dependencyEconomic +
      transformedData.dependencySocial +
      transformedData.dependencyEnvironmental +
      transformedData.influenceEconomic +
      transformedData.influenceSocial +
      transformedData.influenceEnvironmental;

    const dependencyScore = 
      transformedData.dependencyEconomic +
      transformedData.dependencySocial +
      transformedData.dependencyEnvironmental;

    const influenceScore = 
      transformedData.influenceEconomic +
      transformedData.influenceSocial +
      transformedData.influenceEnvironmental;

    const dependencyCategory = dependencyScore >= 12 ? 'High' : dependencyScore >= 9 ? 'Medium' : 'Low';
    const influenceCategory = influenceScore >= 12 ? 'High' : influenceScore >= 9 ? 'Medium' : 'Low';
    const isPriority = influenceCategory === 'High' || dependencyCategory === 'High';

    const stakeholder = await prisma.sEMAStakeholder.create({
      data: {
        clientId,
        ...transformedData,
        totalScore,
        dependencyCategory,
        influenceCategory,
        isPriority,
      },
    });

    return NextResponse.json({ stakeholder }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating stakeholder:', error);
    return NextResponse.json(
      { error: 'Failed to create stakeholder', details: error.message },
      { status: 500 }
    );
  }
}
