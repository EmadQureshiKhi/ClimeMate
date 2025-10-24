import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - List all reports for a client
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

    const reports = await prisma.sEMAReport.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ reports }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Create a new report
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId, ...reportData } = body;

    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      );
    }

    const report = await prisma.sEMAReport.create({
      data: {
        clientId,
        ...reportData,
      },
    });

    return NextResponse.json({ report }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating report:', error);
    return NextResponse.json(
      { error: 'Failed to create report', details: error.message },
      { status: 500 }
    );
  }
}
