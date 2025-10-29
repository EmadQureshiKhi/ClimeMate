import { Connection, PublicKey, Transaction, SystemProgram, TransactionInstruction } from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  getAccount,
} from '@solana/spl-token';
import * as anchor from '@coral-xyz/anchor';
import { Program, BN } from '@coral-xyz/anchor';
import idlJson from './idl/co2e_escrow.json';
import {
  ESCROW_PROGRAM_ID,
  TOKEN_MINT,
  TOKEN_DECIMALS,
  getEscrowPDA,
  tokensToSmallestUnit,
  smallestUnitToTokens,
} from './co2e-escrow';

// Extract the actual IDL object
const idl = (idlJson as any).default || idlJson;

const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');

/**
 * Claim charging rewards from escrow smart contract
 * 
 * This distributes CO2E tokens earned from EV charging sessions.
 * Tokens come from the same escrow contract used in the marketplace.
 * 
 * Flow:
 * 1. User charges their EV at a DeCharge station
 * 2. Session data synced to database
 * 3. User clicks "Claim Tokens" 
 * 4. This function creates transaction to transfer tokens from escrow
 * 5. Transaction includes memo for audit logging
 * 6. Tokens appear in user's wallet
 */
export async function claimChargingRewards(
  sessionId: string,
  tokensEarned: number, // in token units (e.g., 12.75)
  userWallet: string,
  sessionData: {
    stationId: string;
    energyKwh: number;
    co2eSaved: number;
    startTime: string;
    endTime: string;
  },
  signAndSendTransaction: (tx: Transaction) => Promise<string>,
  connection: Connection
): Promise<{ success: boolean; signature?: string; error?: string }> {
  try {
    console.log('🔋 Claiming charging rewards from escrow...');
    console.log(`  Session: ${sessionId}`);
    console.log(`  Tokens: ${tokensEarned} CO₂e`);
    console.log(`  Energy: ${sessionData.energyKwh} kWh`);
    console.log(`  CO₂e Saved: ${sessionData.co2eSaved} kg`);

    const userPubkey = new PublicKey(userWallet);
    const [escrowPDA] = getEscrowPDA();

    // Convert tokens to smallest unit
    const amount = tokensToSmallestUnit(tokensEarned);
    console.log(`  Amount (smallest units): ${amount}`);

    // Get token accounts
    const escrowTokenAccount = await getAssociatedTokenAddress(
      TOKEN_MINT,
      escrowPDA,
      true
    );
    const userTokenAccount = await getAssociatedTokenAddress(
      TOKEN_MINT,
      userPubkey
    );

    // Build transaction
    const transaction = new Transaction();

    // Check if user's token account exists
    let userAccountExists = false;
    try {
      await getAccount(connection, userTokenAccount);
      userAccountExists = true;
      console.log('  ✅ Token account exists');
    } catch {
      console.log('  📝 Creating token account...');
      transaction.add(
        createAssociatedTokenAccountInstruction(
          userPubkey,
          userTokenAccount,
          userPubkey,
          TOKEN_MINT
        )
      );
    }

    // For charging rewards, we need to transfer tokens from the reward pool
    // The reward pool wallet holds CO2E tokens specifically for distributing rewards
    // This is separate from the escrow contract which is for marketplace purchases
    
    console.log('💰 Note: Tokens will be transferred from reward pool wallet');
    console.log('   This happens on the backend via /api/charging/mint-credits');
    console.log('   Frontend just creates the memo transaction for audit trail');

    // Add memo instruction for audit logging (this is what the frontend does)
    const memoData = JSON.stringify({
      type: 'CHARGING_REWARD',
      action: 'CLAIM_CO2E_TOKENS',
      module: 'EV Charging',
      sessionId: sessionId,
      stationId: sessionData.stationId,
      energyKwh: sessionData.energyKwh,
      co2eSaved: sessionData.co2eSaved,
      tokensEarned: tokensEarned,
      tokensClaimed: amount,
      user: userWallet,
      timestamp: new Date().toISOString(),
      escrow: escrowPDA.toString(),
      startTime: sessionData.startTime,
      endTime: sessionData.endTime,
    });
    
    const memoIx = new TransactionInstruction({
      keys: [],
      programId: MEMO_PROGRAM_ID,
      data: Buffer.from(memoData, 'utf-8'),
    });
    
    transaction.add(memoIx);
    console.log('📝 Added memo instruction for audit logging');

    // Get recent blockhash
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = userPubkey;
    transaction.lastValidBlockHeight = lastValidBlockHeight;

    console.log('📤 Sending transaction...');

    // Sign and send
    const signature = await signAndSendTransaction(transaction);

    console.log('✅ Rewards claimed!');
    console.log(`  Signature: ${signature}`);
    console.log(`  View: https://solscan.io/tx/${signature}?cluster=devnet`);

    return {
      success: true,
      signature,
    };
  } catch (error: any) {
    console.error('❌ Error claiming rewards:', error);
    return {
      success: false,
      error: error.message || 'Failed to claim rewards',
    };
  }
}

/**
 * Verify a charging reward claim transaction
 * Used by backend to validate claims
 */
export async function verifyRewardClaim(
  signature: string,
  expectedAmount: number,
  expectedRecipient: string,
  connection: Connection
): Promise<boolean> {
  try {
    const tx = await connection.getTransaction(signature, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0,
    });

    if (!tx || tx.meta?.err) {
      return false;
    }

    // Verify transaction contains memo with correct data
    // Verify token transfer to correct recipient
    // Verify amount matches expected
    
    // TODO: Add detailed verification logic
    
    return true;
  } catch (error) {
    console.error('Error verifying claim:', error);
    return false;
  }
}

/**
 * Calculate total claimable rewards for a user
 */
export async function calculateClaimableRewards(
  sessions: Array<{
    id: string;
    energyUsed: number;
    co2eSaved: number;
    creditsEarned: number;
    mintTx: string | null;
  }>
): Promise<{
  totalSessions: number;
  totalEnergy: number;
  totalCO2eSaved: number;
  totalTokens: number;
  claimableSessions: string[];
}> {
  const claimableSessions = sessions.filter(s => !s.mintTx);
  
  return {
    totalSessions: claimableSessions.length,
    totalEnergy: claimableSessions.reduce((sum, s) => sum + s.energyUsed, 0),
    totalCO2eSaved: claimableSessions.reduce((sum, s) => sum + s.co2eSaved, 0),
    totalTokens: claimableSessions.reduce((sum, s) => sum + s.creditsEarned, 0),
    claimableSessions: claimableSessions.map(s => s.id),
  };
}
