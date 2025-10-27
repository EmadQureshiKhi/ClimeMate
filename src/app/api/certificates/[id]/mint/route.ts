import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { walletAddress } = await request.json();
    const { id } = await params;

    console.log('🎨 Minting offset certificate NFT:', {
      id,
      walletAddress,
    });

    // Get certificate with user info
    const certificate = await prisma.certificate.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!certificate) {
      return NextResponse.json(
        { error: 'Certificate not found' },
        { status: 404 }
      );
    }

    // Allow re-minting after more offsets
    // Users can mint multiple NFTs to show progress at different stages

    // Check if any offset has been made
    if (!certificate.offsetAmount || certificate.offsetAmount === 0) {
      return NextResponse.json(
        { error: 'Cannot mint certificate without any offset' },
        { status: 400 }
      );
    }

    // Use wallet address from request or user
    const userWallet = walletAddress || certificate.user.walletAddress;
    if (!userWallet) {
      return NextResponse.json(
        { error: 'Wallet address required' },
        { status: 400 }
      );
    }

    // Calculate offset percentage
    const offsetPercentage = ((certificate.offsetAmount / certificate.totalEmissions) * 100).toFixed(2);

    // Prepare certificate data for NFT minting
    const certificateData = {
      certificateId: `${certificate.certificateId}-OFFSET`,
      title: `${certificate.title} (${offsetPercentage}% Offset)`,
      totalEmissions: certificate.totalEmissions,
      breakdown: certificate.breakdown as Record<string, number>,
      issueDate: new Date().toISOString(),
      organizationName: certificate.user.name || 'ClimeMate User',
      // Add offset-specific data
      offsetAmount: certificate.offsetAmount,
      offsetPercentage,
      status: certificate.status,
    };

    console.log('🎨 Minting compressed NFT via backend...');
    
    // Mint compressed NFT using the same backend service
    const nftResponse = await fetch(`${request.nextUrl.origin}/api/nft/mint-compressed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        certificateData,
        userWallet,
        userId: certificate.user.privyId,
      }),
    });

    const nftResult = await nftResponse.json();

    if (!nftResponse.ok || !nftResult.success) {
      throw new Error(nftResult.error || nftResult.details || 'Failed to mint NFT');
    }

    console.log('✅ Offset certificate NFT minted:', nftResult);

    // Update certificate with NFT info (only if first mint)
    if (!certificate.nftMintAddress) {
      await prisma.certificate.update({
        where: { id },
        data: {
          nftMintAddress: nftResult.nftAddress,
          nftMetadataUri: nftResult.metadataUri,
        },
      });
      console.log('✅ Certificate updated with first NFT info');
    } else {
      console.log('✅ Additional NFT minted (certificate already has NFT address)');
    }

    // Log to audit trail
    try {
      await fetch(`${request.nextUrl.origin}/api/audit-logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: 'CERTIFICATES',
          action: 'OFFSET_CERTIFICATE_MINTED',
          transactionSignature: nftResult.transactionSignature,
          details: {
            type: 'OFFSET_CERTIFICATE_NFT',
            certificateId: certificate.certificateId,
            nftAddress: nftResult.nftAddress,
            metadataUri: nftResult.metadataUri,
            offsetAmount: certificate.offsetAmount,
            offsetPercentage,
            totalEmissions: certificate.totalEmissions,
            merkleTree: nftResult.merkleTree,
          },
          userWalletAddress: userWallet,
          status: 'success',
        }),
      });
    } catch (logError) {
      console.error('Failed to log certificate minting:', logError);
    }

    return NextResponse.json({
      success: true,
      nftAddress: nftResult.nftAddress,
      metadataUri: nftResult.metadataUri,
      signature: nftResult.transactionSignature,
      merkleTree: nftResult.merkleTree,
      message: 'Offset certificate NFT minted successfully! It will appear in your wallet within 30 seconds.',
    });
  } catch (error: any) {
    console.error('Error minting offset certificate NFT:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to mint offset certificate NFT' },
      { status: 500 }
    );
  }
}
