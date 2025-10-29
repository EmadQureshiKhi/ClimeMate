import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Connection } from '@solana/web3.js';
import { verifyTransaction } from '@/lib/chargemap-payments';

const SOLANA_RPC = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com';
const MIN_WITHDRAWAL = 0.001; // Minimum 0.001 SOL to withdraw

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, amount, transactionSignature } = body;

    if (!walletAddress || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (amount < MIN_WITHDRAWAL) {
      return NextResponse.json(
        { error: `Minimum withdrawal is ${MIN_WITHDRAWAL} SOL` },
        { status: 400 }
      );
    }

    // Get total earnings for user
    const result = await prisma.$queryRaw`
      SELECT SUM(total_earnings_sol) as total_earnings
      FROM virtual_plots
      WHERE owner_wallet = ${walletAddress}
    `;

    const totalEarnings = Array.isArray(result) && result.length > 0
      ? (result[0] as any).total_earnings || 0
      : 0;

    if (totalEarnings < amount) {
      return NextResponse.json(
        { error: 'Insufficient earnings balance' },
        { status: 400 }
      );
    }

    // Verify withdrawal transaction if signature provided
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

    // Deduct earnings from plots (proportionally)
    await prisma.$executeRaw`
      UPDATE virtual_plots
      SET total_earnings_sol = GREATEST(0, total_earnings_sol - (
        total_earnings_sol / ${totalEarnings} * ${amount}
      ))
      WHERE owner_wallet = ${walletAddress}
      AND total_earnings_sol > 0
    `;

    return NextResponse.json({
      success: true,
      message: 'Withdrawal successful',
      amount,
      transactionSignature,
      remainingBalance: totalEarnings - amount,
    });
  } catch (error) {
    console.error('Error processing withdrawal:', error);
    return NextResponse.json(
      { error: 'Failed to process withdrawal' },
      { status: 500 }
    );
  }
}

// GET endpoint to check withdrawal balance
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const walletAddress = searchParams.get('wallet');

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address required' },
        { status: 400 }
      );
    }

    const result = await prisma.$queryRaw`
      SELECT 
        SUM(total_earnings_sol) as total_earnings,
        COUNT(*) as plot_count
      FROM virtual_plots
      WHERE owner_wallet = ${walletAddress}
    `;

    const data = Array.isArray(result) && result.length > 0 ? result[0] as any : {};

    return NextResponse.json({
      totalEarnings: data.total_earnings || 0,
      plotCount: data.plot_count || 0,
      minWithdrawal: MIN_WITHDRAWAL,
    });
  } catch (error) {
    console.error('Error fetching withdrawal balance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch balance' },
      { status: 500 }
    );
  }
}
