import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Connection } from '@solana/web3.js';
import { verifyTransaction } from '@/lib/chargemap-payments';

const SOLANA_RPC = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com';

export const CHARGER_COSTS = {
  1: 0.01, // Level 1: 0.01 SOL
  2: 0.05, // Level 2: 0.05 SOL
  3: 0.1,  // Level 3: 0.1 SOL
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { plotId, walletAddress, level, transactionSignature } = body;

    if (!plotId || !walletAddress || !level) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (![1, 2, 3].includes(level)) {
      return NextResponse.json(
        { error: 'Invalid charger level' },
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

    // Verify ownership
    const plot = await prisma.$queryRaw`
      SELECT * FROM virtual_plots 
      WHERE id = ${plotId} AND owner_wallet = ${walletAddress}
    `;

    if (!Array.isArray(plot) || plot.length === 0) {
      return NextResponse.json(
        { error: 'Plot not found or not owned by wallet' },
        { status: 404 }
      );
    }

    const currentPlot = plot[0] as any;

    // Check if upgrading
    if (currentPlot.charger_level >= level) {
      return NextResponse.json(
        { error: 'Cannot downgrade or install same level charger' },
        { status: 400 }
      );
    }

    // Install/upgrade charger
    await prisma.$executeRaw`
      UPDATE virtual_plots 
      SET 
        has_charger = true,
        charger_level = ${level},
        updated_at = NOW()
      WHERE id = ${plotId}
    `;

    return NextResponse.json({
      success: true,
      message: `Level ${level} charger installed successfully`,
      cost: CHARGER_COSTS[level as keyof typeof CHARGER_COSTS],
      transactionSignature,
    });
  } catch (error) {
    console.error('Error installing charger:', error);
    return NextResponse.json(
      { error: 'Failed to install charger' },
      { status: 500 }
    );
  }
}
