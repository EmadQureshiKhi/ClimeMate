import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { mintCertificateNFT } from '@/lib/solana-nft';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { amount, transactionSignature, walletAddress } = await request.json();
    const certificateId = params.id;

    console.log('🔥 Processing retirement:', {
      certificateId,
      amount,
      transactionSignature,
      walletAddress,
    });

    // Validate input
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    if (!transactionSignature) {
      return NextResponse.json(
        { error: 'Transaction signature required' },
        { status: 400 }
      );
    }

    // Get certificate
    const certificate = await prisma.certificate.findUnique({
      where: { id: certificateId },
    });

    if (!certificate) {
      return NextResponse.json(
        { error: 'Certificate not found' },
        { status: 404 }
      );
    }

    // Calculate new offset amount
    const newOffsetAmount = (certificate.offsetAmount || 0) + amount;
    const totalEmissions = certificate.totalEmissions || 0;

    // Ensure we don't exceed total emissions
    if (newOffsetAmount > totalEmissions) {
      return NextResponse.json(
        { error: 'Cannot offset more than total emissions' },
        { status: 400 }
      );
    }

    // Calculate offset percentage
    const offsetPercentage = (newOffsetAmount / totalEmissions) * 100;
    const isFullyOffset = newOffsetAmount >= totalEmissions;

    // Determine status
    let status: 'pending' | 'verified' | 'partially_offset' | 'fully_offset' = certificate.status as any;
    if (isFullyOffset) {
      status = 'fully_offset';
    } else if (newOffsetAmount > 0) {
      status = 'partially_offset';
    }

    console.log('📊 Retirement calculation:', {
      previousOffset: certificate.offsetAmount,
      newOffset: newOffsetAmount,
      totalEmissions,
      offsetPercentage: offsetPercentage.toFixed(2) + '%',
      isFullyOffset,
      status,
    });

    // Update certificate
    const updatedCertificate = await prisma.certificate.update({
      where: { id: certificateId },
      data: {
        offsetAmount: newOffsetAmount,
        status,
      },
    });

    // Log to audit trail
    try {
      await fetch(`${request.nextUrl.origin}/api/audit-logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: 'CERTIFICATES',
          action: 'RETIRE_CREDITS',
          transactionSignature,
          details: {
            type: 'OFFSET_EMISSIONS',
            certificateId,
            amount,
            newOffsetAmount,
            totalEmissions,
            offsetPercentage: offsetPercentage.toFixed(2),
            isFullyOffset,
            status,
          },
          userWalletAddress: walletAddress,
          status: 'success',
        }),
      });
    } catch (logError) {
      console.error('Failed to log retirement:', logError);
      // Don't fail the operation if logging fails
    }

    // Mint NFT if fully offset
    let nftMinted = false;
    let nftMintAddress = null;

    if (isFullyOffset && !certificate.nftMintAddress) {
      console.log('🎨 Certificate fully offset! Minting NFT...');
      
      try {
        const nftResult = await mintCertificateNFT({
          certificateId: certificate.id,
          companyName: certificate.companyName,
          totalEmissions: certificate.totalEmissions || 0,
          offsetAmount: newOffsetAmount,
          verificationDate: certificate.verificationDate || new Date(),
          certificateType: certificate.certificateType || 'emissions',
          metadata: certificate.metadata as any,
        });

        if (nftResult.success && nftResult.mintAddress) {
          nftMintAddress = nftResult.mintAddress;
          nftMinted = true;

          // Update certificate with NFT address
          await prisma.certificate.update({
            where: { id: certificateId },
            data: {
              nftMintAddress,
              nftMetadataUri: nftResult.metadataUri,
            },
          });

          console.log('✅ NFT minted:', nftMintAddress);

          // Log NFT minting
          try {
            await fetch(`${request.nextUrl.origin}/api/audit-logs`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                module: 'CERTIFICATES',
                action: 'NFT_MINTED',
                transactionSignature: nftResult.signature,
                details: {
                  type: 'OFFSET_NFT',
                  certificateId,
                  nftMintAddress,
                  metadataUri: nftResult.metadataUri,
                  reason: 'Certificate fully offset',
                },
                userWalletAddress: walletAddress,
                status: 'success',
              }),
            });
          } catch (logError) {
            console.error('Failed to log NFT minting:', logError);
          }
        }
      } catch (nftError) {
        console.error('Failed to mint NFT:', nftError);
        // Don't fail the retirement if NFT minting fails
      }
    }

    return NextResponse.json({
      success: true,
      certificate: {
        id: updatedCertificate.id,
        offsetAmount: newOffsetAmount,
        offsetPercentage: offsetPercentage.toFixed(2),
        status,
        isFullyOffset,
      },
      nftMinted,
      nftMintAddress,
      message: isFullyOffset
        ? 'Certificate fully offset! NFT minted.'
        : `Retired ${amount} CO₂e credits. ${offsetPercentage.toFixed(1)}% offset.`,
    });
  } catch (error: any) {
    console.error('Error processing retirement:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process retirement' },
      { status: 500 }
    );
  }
}
