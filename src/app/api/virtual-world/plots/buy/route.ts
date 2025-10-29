import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cellToLatLng } from 'h3-js';
import { Connection, PublicKey } from '@solana/web3.js';
import { verifyTransaction } from '@/lib/chargemap-payments';

const SOLANA_RPC = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { h3Index, walletAddress, priceSol, transactionSignature } = body;

    if (!h3Index || !walletAddress || !priceSol) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify transaction if signature provided
    if (transactionSignature) {
      const connection = new Connection(SOLANA_RPC, 'confirmed');
      const isValid = await verifyTransaction(connection, transactionSignature);
      
      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid or failed transaction' },
          { status: 400 }
        );
      }
    }

    // Check if plot already exists
    const existing = await prisma.$queryRaw`
      SELECT * FROM virtual_plots WHERE h3_index = ${h3Index}
    `;

    if (Array.isArray(existing) && existing.length > 0) {
      const plot = existing[0] as any;
      if (plot.owner_wallet) {
        return NextResponse.json(
          { error: 'Plot already owned' },
          { status: 400 }
        );
      }
    }

    // Get center coordinates
    const [lat, lng] = cellToLatLng(h3Index);

    // Check if hex contains any stations
    const stations = await prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM station_hex_mapping 
      WHERE h3_index = ${h3Index}
    `;
    const stationCount = Array.isArray(stations) && stations.length > 0 
      ? (stations[0] as any).count 
      : 0;

    const isPremium = stationCount > 0;

    // Create or update plot
    if (Array.isArray(existing) && existing.length > 0) {
      // Update existing plot
      await prisma.$executeRaw`
        UPDATE virtual_plots 
        SET 
          owner_wallet = ${walletAddress},
          purchased_at = NOW(),
          purchase_price_sol = ${priceSol},
          current_price_sol = ${priceSol},
          station_count = ${stationCount},
          is_premium = ${isPremium},
          updated_at = NOW()
        WHERE h3_index = ${h3Index}
      `;
    } else {
      // Create new plot
      await prisma.$executeRaw`
        INSERT INTO virtual_plots (
          h3_index, center_lat, center_lng, owner_wallet,
          purchased_at, purchase_price_sol, current_price_sol,
          station_count, is_premium, resolution
        ) VALUES (
          ${h3Index}, ${lat}, ${lng}, ${walletAddress},
          NOW(), ${priceSol}, ${priceSol},
          ${stationCount}, ${isPremium}, 8
        )
      `;
    }

    return NextResponse.json({
      success: true,
      message: 'Plot purchased successfully',
      h3Index,
      transactionSignature,
    });
  } catch (error) {
    console.error('Error buying plot:', error);
    return NextResponse.json(
      { error: 'Failed to buy plot' },
      { status: 500 }
    );
  }
}
