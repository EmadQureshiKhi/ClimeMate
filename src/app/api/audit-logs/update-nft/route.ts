import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST - Update audit log with NFT transaction details
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { certificateId, nftTransactionSignature, nftAddress, metadataUri } = body;

    if (!certificateId || !nftTransactionSignature) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Find the most recent certificate_created log for this certificate
    const log = await prisma.auditLog.findFirst({
      where: {
        action: 'certificate_created',
        details: {
          path: ['certificateId'],
          equals: certificateId,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!log) {
      console.log('⚠️ No audit log found for certificate:', certificateId);
      return NextResponse.json(
        { error: 'Audit log not found' },
        { status: 404 }
      );
    }

    // Update the log with NFT transaction details
    const updatedLog = await prisma.auditLog.update({
      where: { id: log.id },
      data: {
        details: {
          ...(log.details as any),
          nftTransactionSignature,
          nftAddress,
          metadataUri,
        },
      },
    });

    console.log('✅ Audit log updated with NFT transaction:', log.id);
    return NextResponse.json({ log: updatedLog }, { status: 200 });
  } catch (error: any) {
    console.error('❌ Error updating audit log:', error);
    return NextResponse.json(
      { error: 'Failed to update log', details: error.message },
      { status: 500 }
    );
  }
}
