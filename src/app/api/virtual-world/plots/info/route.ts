import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const h3Index = searchParams.get('h3Index');

    if (!h3Index) {
      return NextResponse.json(
        { error: 'H3 index required' },
        { status: 400 }
      );
    }

    // Check if plot exists in database
    const plot = await prisma.$queryRaw`
      SELECT * FROM virtual_plots WHERE h3_index = ${h3Index}
    `;

    if (Array.isArray(plot) && plot.length > 0) {
      return NextResponse.json({ plot: plot[0], exists: true });
    }

    // Check if hex contains any stations
    const stations = await prisma.$queryRaw`
      SELECT * FROM station_hex_mapping WHERE h3_index = ${h3Index}
    `;

    const stationCount = Array.isArray(stations) ? stations.length : 0;
    const isPremium = stationCount > 0;

    return NextResponse.json({
      plot: null,
      exists: false,
      stationCount,
      isPremium,
      suggestedPrice: isPremium ? 0.1 : 0.01,
    });
  } catch (error) {
    console.error('Error fetching plot info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch plot info' },
      { status: 500 }
    );
  }
}
