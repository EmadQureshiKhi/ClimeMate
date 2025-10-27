import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: certificateId } = await params;

    // Check if this is an offset certificate (ends with -OFFSET)
    const isOffsetCert = certificateId.endsWith('-OFFSET');
    const baseCertificateId = isOffsetCert ? certificateId.replace('-OFFSET', '') : certificateId;

    // Fetch certificate from database
    const certificate = await prisma.certificate.findUnique({
      where: { certificateId: baseCertificateId },
      select: {
        certificateId: true,
        totalEmissions: true,
        offsetAmount: true,
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

    // Check if this is a GHG Calculator certificate
    const isGHGCalc = baseCertificateId.startsWith('GHG-CALC-');
    
    // Calculate offset percentage if this is an offset certificate
    const offsetAmount = certificate.offsetAmount || 0;
    const offsetPercentage = certificate.totalEmissions > 0 
      ? ((offsetAmount / certificate.totalEmissions) * 100).toFixed(2)
      : '0.00';
    
    // Create NFT metadata with comprehensive attributes
    const metadata = {
      name: isOffsetCert 
        ? `Offset Certificate ${baseCertificateId} (${offsetPercentage}%)`
        : isGHGCalc 
          ? `GHG Calculator Certificate` 
          : `Carbon Certificate ${baseCertificateId}`,
      symbol: 'CARBON',
      description: isOffsetCert
        ? `Carbon offset certificate documenting ${offsetAmount.toFixed(2)} kg CO₂e retired (${offsetPercentage}% of ${certificate.totalEmissions.toFixed(2)} kg CO₂e total emissions) across ${categories} categories from ${totalRows} activities.`
        : isGHGCalc 
          ? `GHG Calculator verified certificate documenting ${certificate.totalEmissions.toFixed(2)} kg CO₂e emissions across ${categories} categories from ${totalRows} activities.`
          : `Verified carbon footprint certificate documenting ${certificate.totalEmissions.toFixed(2)} kg CO₂e emissions across ${categories} categories from ${totalRows} activities.`,
      image: 'https://i.ibb.co/dwzM2KLM/Untitled-design-removebg-preview.png',
      external_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/certificates/${baseCertificateId}`,
      attributes: [
        {
          trait_type: 'Certificate ID',
          value: baseCertificateId,
        },
        ...(isOffsetCert ? [{
          trait_type: 'Certificate Type',
          value: 'Offset Certificate',
        }] : isGHGCalc ? [{
          trait_type: 'Certificate Type',
          value: 'GHG Calculator',
        }] : []),
        {
          trait_type: 'Total Emissions (kg CO₂e)',
          value: certificate.totalEmissions.toFixed(2),
          display_type: 'number',
        },
        ...(isOffsetCert ? [
          {
            trait_type: 'Offset Amount (kg CO₂e)',
            value: offsetAmount.toFixed(2),
            display_type: 'number',
          },
          {
            trait_type: 'Offset Percentage',
            value: `${offsetPercentage}%`,
          },
          {
            trait_type: 'Remaining Emissions (kg CO₂e)',
            value: (certificate.totalEmissions - offsetAmount).toFixed(2),
            display_type: 'number',
          },
        ] : []),
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
        // Add breakdown by category - handle both CSV upload and GHG Calculator formats
        ...Object.entries(breakdown || {}).slice(0, 5).map(([category, emissions]: [string, any]) => ({
          trait_type: `${category} (kg CO₂e)`,
          value: Number(emissions).toFixed(2),
          display_type: 'number',
        })),
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
