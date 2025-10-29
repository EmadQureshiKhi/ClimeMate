import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Connection, PublicKey, Transaction, Keypair, TransactionInstruction, sendAndConfirmTransaction } from '@solana/web3.js';
import {
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getAssociatedTokenAddress,
  getAccount,
} from '@solana/spl-token';
import { CO2E_MINT, tokensToSmallestUnit } from '@/lib/co2e-token';
import bs58 from 'bs58';

const SOLANA_RPC = process.env.NEXT_PUBLIC_SOLANA_RPC || 'https://api.devnet.solana.com';
const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');

export async function POST(request: NextRequest) {
  try {
    const { sessionId, userWallet, amount, co2eSaved, energyUsed, stationId, transactionSignature, memoSignature } = await request.json();

    console.log('🔋 Minting charging credits:', {
      sessionId,
      userWallet,
      amount,
      co2eSaved,
      energyUsed,
      stationId,
      transactionSignature: transactionSignature ? 'PROVIDED' : 'WILL_CREATE',
      memoSignature: memoSignature ? 'PROVIDED' : 'NONE',
    });

    // Validate inputs
    if (!sessionId || !userWallet || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get user from wallet address
    const user = await prisma.user.findFirst({
      where: { walletAddress: userWallet },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found. Please sync your wallet.' },
        { status: 404 }
      );
    }

    // Check if credits already minted for this session
    const existingSession = await prisma.chargingSession.findUnique({
      where: { sessionId },
    });

    if (existingSession?.mintTx) {
      return NextResponse.json(
        { error: 'Credits already minted for this session', signature: existingSession.mintTx },
        { status: 400 }
      );
    }

    // If transaction signature provided (user claimed via smart contract), just record it
    if (transactionSignature) {
      console.log('✅ Transaction signature provided, recording claim...');
      
      const connection = new Connection(SOLANA_RPC, 'confirmed');
      
      // Verify transaction exists and is confirmed
      try {
        const tx = await connection.getTransaction(transactionSignature, {
          commitment: 'confirmed',
          maxSupportedTransactionVersion: 0,
        });
        
        if (!tx || tx.meta?.err) {
          return NextResponse.json(
            { error: 'Transaction not found or failed' },
            { status: 400 }
          );
        }
        
        console.log('✅ Transaction verified on-chain');
      } catch (verifyError) {
        console.error('❌ Failed to verify transaction:', verifyError);
        return NextResponse.json(
          { error: 'Failed to verify transaction' },
          { status: 400 }
        );
      }

      // Update session with transaction signature
      const pointsEarned = Math.floor((energyUsed || 0) * 10);
      await prisma.chargingSession.update({
        where: { sessionId },
        data: {
          mintTx: transactionSignature,
          status: 'completed',
        },
      });

      // Update charging points
      await prisma.chargingPoints.upsert({
        where: { userWallet },
        update: {
          points: { increment: pointsEarned },
          earned: { increment: pointsEarned },
        },
        create: {
          userId: user.id,
          userWallet,
          points: pointsEarned,
          earned: pointsEarned,
        },
      });

      console.log('✅ Claim recorded successfully');

      return NextResponse.json({
        success: true,
        signature: transactionSignature,
        creditsEarned: amount,
        pointsEarned,
        message: `Claimed ${amount.toFixed(2)} CO₂e credits!`,
      });
    }

    // Otherwise, transfer tokens from reward pool (legacy method)
    console.log('💰 Transferring CO₂e tokens from reward pool...');
    
    const backendWalletKey = process.env.BACKEND_WALLET_PRIVATE_KEY;
    if (!backendWalletKey) {
      console.error('❌ BACKEND_WALLET_PRIVATE_KEY not configured');
      return NextResponse.json(
        { error: 'Backend wallet not configured' },
        { status: 500 }
      );
    }

    // Decode backend wallet private key (reward pool wallet)
    let secretKey: Uint8Array;
    try {
      secretKey = bs58.decode(backendWalletKey);
    } catch (e) {
      secretKey = Buffer.from(backendWalletKey, 'base64');
    }

    const connection = new Connection(SOLANA_RPC, 'confirmed');
    const rewardPoolWallet = Keypair.fromSecretKey(secretKey);
    const userPubkey = new PublicKey(userWallet);
    
    console.log('🏦 Reward Pool:', rewardPoolWallet.publicKey.toBase58());
    console.log('👤 User:', userPubkey.toBase58());
    console.log('💵 Amount:', amount, 'CO₂e');

    // Get token accounts
    const rewardPoolTokenAccount = await getAssociatedTokenAddress(
      CO2E_MINT,
      rewardPoolWallet.publicKey
    );
    
    const userTokenAccount = await getAssociatedTokenAddress(
      CO2E_MINT,
      userPubkey
    );

    // Create transaction
    const transaction = new Transaction();

    // Check if user's token account exists, create if not
    let userAccountExists = false;
    try {
      await getAccount(connection, userTokenAccount);
      userAccountExists = true;
      console.log('✅ User token account exists');
    } catch {
      console.log('📝 Creating token account for user...');
      transaction.add(
        createAssociatedTokenAccountInstruction(
          rewardPoolWallet.publicKey, // payer (reward pool pays for account creation)
          userTokenAccount,
          userPubkey, // owner
          CO2E_MINT
        )
      );
    }

    // Check reward pool balance
    try {
      const rewardPoolAccount = await getAccount(connection, rewardPoolTokenAccount);
      const rewardPoolBalance = Number(rewardPoolAccount.amount) / Math.pow(10, 2); // 2 decimals
      console.log(`🏦 Reward Pool Balance: ${rewardPoolBalance} CO₂e`);
      
      if (rewardPoolBalance < amount) {
        console.warn(`⚠️ Insufficient reward pool balance: ${rewardPoolBalance} < ${amount}`);
        // Continue anyway for demo - in production, this should fail
      }
    } catch (error) {
      console.error('❌ Could not check reward pool balance:', error);
      // Continue anyway - might be first time
    }

    // Add memo with charging session details
    const memoData = JSON.stringify({
      type: 'EV_CHARGING_REWARD',
      sessionId,
      energyUsed,
      co2eSaved,
      creditsEarned: amount,
      stationId: stationId || 'UNKNOWN',
      timestamp: new Date().toISOString(),
    });
    
    transaction.add(
      new TransactionInstruction({
        keys: [],
        programId: MEMO_PROGRAM_ID,
        data: Buffer.from(memoData, 'utf-8'),
      })
    );

    // Add transfer instruction (reward pool -> user)
    const transferAmount = tokensToSmallestUnit(amount); // Convert to smallest unit (2 decimals)
    console.log(`💸 Transferring ${transferAmount} smallest units (${amount} CO₂e)`);
    
    transaction.add(
      createTransferInstruction(
        rewardPoolTokenAccount, // from
        userTokenAccount, // to
        rewardPoolWallet.publicKey, // owner
        transferAmount
      )
    );

    // Send transaction
    console.log('📤 Sending transaction...');
    let signature: string;
    
    try {
      signature = await sendAndConfirmTransaction(
        connection,
        transaction,
        [rewardPoolWallet], // Reward pool signs
        {
          commitment: 'confirmed',
          skipPreflight: false,
        }
      );
      
      console.log('✅ Transaction confirmed:', signature);
      console.log(`🔗 View on Solscan: https://solscan.io/tx/${signature}?cluster=devnet`);
    } catch (txError: any) {
      console.error('❌ Transaction failed:', txError);
      
      // If reward pool doesn't have tokens, create a helpful error message
      if (txError.message?.includes('insufficient funds') || txError.message?.includes('0x1')) {
        return NextResponse.json(
          { 
            error: 'Reward pool needs CO₂e tokens. Please fund the reward pool wallet first.',
            rewardPoolWallet: rewardPoolWallet.publicKey.toBase58(),
          },
          { status: 500 }
        );
      }
      
      throw txError;
    }

    // Update or create charging session
    const pointsEarned = Math.floor(energyUsed * 10);
    const session = await prisma.chargingSession.upsert({
      where: { sessionId },
      update: {
        mintTx: signature,
        status: 'completed',
      },
      create: {
        sessionId,
        userId: user.id,
        userWallet,
        stationId: stationId || 'STATION-UNKNOWN',
        energyUsed,
        co2eSaved,
        creditsEarned: amount,
        pointsEarned,
        startTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        endTime: new Date(),
        cost: energyUsed * 0.3,
        mintTx: signature,
        status: 'completed',
      },
    });

    // Update or create charging points
    await prisma.chargingPoints.upsert({
      where: { userWallet },
      update: {
        points: {
          increment: pointsEarned,
        },
        earned: {
          increment: pointsEarned,
        },
      },
      create: {
        userId: user.id,
        userWallet,
        points: pointsEarned,
        earned: pointsEarned,
      },
    });

    // Update virtual world profile (XP, trees, achievements)
    let virtualWorldRewards = null;
    try {
      console.log('🌱 Updating virtual world profile...');
      const virtualResponse = await fetch(`${request.nextUrl.origin}/api/virtual-world/update-on-charge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userWallet,
          energyDelivered: energyUsed,
          co2eSaved,
        }),
      });

      if (virtualResponse.ok) {
        const virtualData = await virtualResponse.json();
        virtualWorldRewards = virtualData.rewards;
        console.log('✅ Virtual world updated:', virtualWorldRewards);
      }
    } catch (virtualError) {
      console.warn('⚠️  Failed to update virtual world (non-critical):', virtualError);
    }

    // Log to audit trail
    try {
      await fetch(`${request.nextUrl.origin}/api/audit-logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: 'EV_CHARGING',
          action: 'CREDITS_EARNED',
          transactionSignature: signature,
          details: {
            sessionId,
            stationId: stationId || 'UNKNOWN',
            energyUsed,
            co2eSaved,
            creditsEarned: amount,
            pointsEarned,
            memoSignature: memoSignature || 'NONE',
            transferSignature: signature,
          },
          userWalletAddress: userWallet,
          status: 'success',
        }),
      });
    } catch (logError) {
      console.error('Failed to log credit minting:', logError);
    }

    console.log('✅ Charging credits transferred:', signature);
    console.log(`💡 User earned ${amount.toFixed(2)} CO₂e credits and ${pointsEarned} points`);

    return NextResponse.json({
      success: true,
      signature,
      creditsEarned: amount,
      pointsEarned,
      virtualWorldRewards,
      message: `Earned ${amount.toFixed(2)} CO₂e credits from charging!`,
    });
  } catch (error: any) {
    console.error('Error minting charging credits:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to mint charging credits' },
      { status: 500 }
    );
  }
}
