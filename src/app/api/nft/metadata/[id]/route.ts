import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: certificateId } = await params;

    // Fetch certificate from database
    const certificate = await prisma.certificate.findUnique({
      where: { certificateId },
      select: {
        certificateId: true,
        totalEmissions: true,
        createdAt: true,
        issueDate: true,
        validUntil: true,
        status: true,
        breakdown: true,
        processedData: true,
        summary: true,
      },
    });

    if (!certificate) {
      return NextResponse.json(
        { error: 'Certificate not found' },
        { status: 404 }
      );
    }

    // Parse breakdown and summary if they exist
    const breakdown = certificate.breakdown as any;
    const summary = certificate.summary as any;

    // Calculate category breakdown for attributes
    const categories = summary?.categories || 0;
    const totalRows = summary?.totalRows || 0;

    // Create NFT metadata with comprehensive attributes
    const metadata = {
      name: `Carbon Certificate ${certificateId}`,
      symbol: 'CARBON',
      description: `Verified carbon footprint certificate documenting ${certificate.totalEmissions.toFixed(2)} kg CO₂e emissions across ${categories} categories from ${totalRows} activities.`,
      image: 'https://i.ibb.co/dwzM2KLM/Untitled-design-removebg-preview.png',
      external_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/certificates/${certificateId}`,
      attributes: [
        {
          trait_type: 'Certificate ID',
          value: certificateId,
        },
        {
          trait_type: 'Total Emissions (kg CO₂e)',
          value: certificate.totalEmissions.toFixed(2),
          display_type: 'number',
        },
        {
          trait_type: 'Issue Date',
          value: (certificate.issueDate || certificate.createdAt).toISOString().split('T')[0],
        },
        {
          trait_type: 'Valid Until',
          value: certificate.validUntil?.toISOString().split('T')[0] || 'N/A',
        },
        {
          trait_type: 'Status',
          value: certificate.status || 'verified',
        },
        {
          trait_type: 'Categories',
          value: categories.toString(),
          display_type: 'number',
        },
        {
          trait_type: 'Activities Tracked',
          value: totalRows.toString(),
          display_type: 'number',
        },
        // Add breakdown by category if available
        ...(breakdown?.electricity ? [{
          trait_type: 'Electricity (kg CO₂e)',
          value: breakdown.electricity.toFixed(2),
          display_type: 'number',
        }] : []),
        ...(breakdown?.['natural gas'] ? [{
          trait_type: 'Natural Gas (kg CO₂e)',
          value: breakdown['natural gas'].toFixed(2),
          display_type: 'number',
        }] : []),
        ...(breakdown?.['petrol car'] ? [{
          trait_type: 'Transport (kg CO₂e)',
          value: (breakdown['petrol car'] + (breakdown['domestic flight'] || 0)).toFixed(2),
          display_type: 'number',
        }] : []),
        ...(breakdown?.['landfill waste'] ? [{
          trait_type: 'Waste (kg CO₂e)',
          value: breakdown['landfill waste'].toFixed(2),
          display_type: 'number',
        }] : []),
      ],
    };

    return NextResponse.json(metadata, {
      headers: {
        // Allow caching but make it refreshable (not immutable)
        // Wallets will cache for 1 hour but can refresh if needed
        'Cache-Control': 'public, max-age=3600, must-revalidate',
        'Content-Type': 'application/json',
        // CORS headers for wallet extensions
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error: any) {
    console.error('Error fetching NFT metadata:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metadata' },
      { status: 500 }
    );
  }
}
