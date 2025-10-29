import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PublicKey } from '@solana/web3.js';
import { mintPlotNFT, PlotNFTMetadata } from '@/lib/chargemap-nft';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { plotId, walletAddress } = body;

    if (!plotId || !walletAddress) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get plot info
    const plots = await prisma.$queryRaw`
      SELECT * FROM virtual_plots WHERE id = ${plotId}
    `;

    if (!Array.isArray(plots) || plots.length === 0) {
      return NextResponse.json(
        { error: 'Plot not found' },
        { status: 404 }
      );
    }

    const plot = plots[0] as any;

    // Verify ownership
    if (plot.owner_wallet !== walletAddress) {
      return NextResponse.json(
        { error: 'You do not own this plot' },
        { status: 403 }
      );
    }

    // Check if already minted
    if (plot.nft_mint) {
      return NextResponse.json(
        { error: 'NFT already minted for this plot' },
        { status: 400 }
      );
    }

    // Prepare metadata
    const metadata: PlotNFTMetadata = {
      h3Index: plot.h3_index,
      centerLat: parseFloat(plot.center_lat),
      centerLng: parseFloat(plot.center_lng),
      isPremium: plot.is_premium,
      stationCount: plot.station_count,
      purchasePrice: parseFloat(plot.purchase_price_sol),
      purchaseDate: plot.purchased_at.toISOString(),
    };

    // Mint NFT
    const ownerPublicKey = new PublicKey(walletAddress);
    const nftMint = await mintPlotNFT(ownerPublicKey, metadata);

    // Update plot with NFT mint address
    await prisma.$executeRaw`
      UPDATE virtual_plots 
      SET 
        nft_mint = ${nftMint},
        updated_at = NOW()
      WHERE id = ${plotId}
    `;

    return NextResponse.json({
      success: true,
      message: 'Plot NFT minted successfully',
      nftMint,
      metadata,
    });
  } catch (error) {
    console.error('Error minting plot NFT:', error);
    return NextResponse.json(
      { error: 'Failed to mint NFT' },
      { status: 500 }
    );
  }
}
