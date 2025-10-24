import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get certificate by ID
    const certificate = await prisma.certificate.findUnique({
      where: { id },
    });

    if (!certificate) {
      return NextResponse.json(
        { error: 'Certificate not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ certificate }, { status: 200 });
  } catch (error) {
    console.error('Error fetching certificate:', error);
    return NextResponse.json(
      { error: 'Failed to fetch certificate' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Update certificate with blockchain data
    const certificate = await prisma.certificate.update({
      where: { id },
      data: {
        blockchainTx: body.blockchainTx,
        nftAddress: body.nftAddress,
        metadataUri: body.metadataUri,
        logTransactionSignature: body.logTransactionSignature,
      },
    });

    // Update audit log with memo transaction signature
    if (body.logTransactionSignature && certificate.certificateId) {
      try {
        const auditLog = await prisma.auditLog.findFirst({
          where: {
            action: 'certificate_created',
            details: {
              path: ['certificateId'],
              equals: certificate.certificateId,
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        });

        if (auditLog) {
          await prisma.auditLog.update({
            where: { id: auditLog.id },
            data: {
              transactionSignature: body.logTransactionSignature,
            },
          });
          console.log('✅ Audit log updated with memo transaction');
        }
      } catch (logError) {
        console.error('Failed to update audit log:', logError);
        // Don't fail the whole operation
      }
    }

    return NextResponse.json({ certificate }, { status: 200 });
  } catch (error) {
    console.error('Error updating certificate:', error);
    return NextResponse.json(
      { error: 'Failed to update certificate' },
      { status: 500 }
    );
  }
}
