import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Get sample parameters for a client
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

    const parameters = await prisma.sEMASampleParameters.findUnique({
      where: { clientId },
    });

    return NextResponse.json({ parameters }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching sample parameters:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sample parameters', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Create or update sample parameters
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId, ...parametersData } = body;

    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      );
    }

    // Transform snake_case to camelCase for Prisma
    const transformedData = {
      confidenceLevel: parametersData.confidence_level || parametersData.confidenceLevel,
      marginError: parametersData.margin_error || parametersData.marginError,
      populationProportion: parametersData.population_proportion || parametersData.populationProportion,
      zScore: parametersData.z_score || parametersData.zScore,
      baseSampleSize: parametersData.base_sample_size || parametersData.baseSampleSize,
    };

    // Upsert (create or update)
    const parameters = await prisma.sEMASampleParameters.upsert({
      where: { clientId },
      update: {
        ...transformedData,
        updatedAt: new Date(),
      },
      create: {
        clientId,
        ...transformedData,
      },
    });

    return NextResponse.json({ parameters }, { status: 200 });
  } catch (error: any) {
    console.error('Error saving sample parameters:', error);
    return NextResponse.json(
      { error: 'Failed to save sample parameters', details: error.message },
      { status: 500 }
    );
  }
}
