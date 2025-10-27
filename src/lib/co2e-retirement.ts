import { Connection, PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  createBurnInstruction,
  getAssociatedTokenAddress,
  getAccount,
} from '@solana/spl-token';
import { CO2E_MINT, CO2E_DECIMALS, tokensToSmallestUnit, smallestUnitToTokens } from './co2e-token';
import { sendTransactionWithGateway } from './sanctum-gateway';

/**
 * Carbon Credit Retirement System
 * 
 * Allows users to retire (burn) CO₂e tokens to offset emissions from certificates.
 * When tokens are burned, they are permanently removed from circulation.
 */

export interface RetirementResult {
  success: boolean;
  signature?: string;
  error?: string;
}

/**
 * Retire (burn) CO₂e tokens to offset a certificate's emissions
 * 
 * @param walletAddress - User's wallet address
 * @param certificateId - Certificate ID being offset
 * @param amount - Amount of CO₂e tokens to retire (in tokens, not smallest units)
 * @param totalEmissions - Total emissions of the certificate (for validation)
 * @param signAndSendTransaction - Function to sign and send transaction
 * @param connection - Solana connection
 */
export async function retireCO2eTokens(
  walletAddress: string,
  certificateId: string,
  amount: number,
  totalEmissions: number,
  signAndSendTransaction: (tx: any) => Promise<any>,
  connection: Connection
): Promise<RetirementResult> {
  try {
    console.log('🔥 Retiring CO₂e tokens...');
    console.log(`  Certificate: ${certificateId}`);
    console.log(`  Amount: ${amount} CO₂e`);
    console.log(`  Total Emissions: ${totalEmissions} kg`);

    // Validate amount
    if (amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    if (amount > totalEmissions) {
      throw new Error('Cannot retire more than total emissions');
    }

    const walletPubkey = new PublicKey(walletAddress);

    // Get user's token account
    const tokenAccount = await getAssociatedTokenAddress(
      CO2E_MINT,
      walletPubkey
    );

    // Check balance
    const accountInfo = await getAccount(connection, tokenAccount);
    const balance = smallestUnitToTokens(accountInfo.amount);

    console.log(`  Current Balance: ${balance} CO₂e`);

    if (balance < amount) {
      throw new Error(`Insufficient balance. You have ${balance} CO₂e but need ${amount} CO₂e`);
    }

    // Convert to smallest units
    const burnAmount = tokensToSmallestUnit(amount);

    const transaction = new Transaction();

    // Add burn instruction
    console.log(`  🔥 Burning ${amount} CO₂e tokens (${burnAmount} smallest units)...`);
    transaction.add(
      createBurnInstruction(
        tokenAccount,
        CO2E_MINT,
        walletPubkey,
        burnAmount
      )
    );

    // Add memo for on-chain logging
    const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');
    const memoData = JSON.stringify({
      type: 'RETIRE_CO2E_CREDITS',
      certificateId,
      amount,
      totalEmissions,
      timestamp: new Date().toISOString(),
      action: 'OFFSET_EMISSIONS',
    });

    transaction.add(
      new TransactionInstruction({
        keys: [],
        programId: MEMO_PROGRAM_ID,
        data: Buffer.from(memoData, 'utf-8'),
      })
    );

    // Get recent blockhash
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = walletPubkey;
    transaction.lastValidBlockHeight = lastValidBlockHeight;

    console.log('📦 Transaction built, sending...');

    // Check network - use Gateway on mainnet, direct send on devnet
    const SOLANA_NETWORK = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet';
    const isMainnet = SOLANA_NETWORK === 'mainnet-beta';

    let result;

    if (isMainnet) {
      // Use Gateway on mainnet for optimal delivery
      console.log('🚀 Sending via Gateway (mainnet)...');
      result = await sendTransactionWithGateway({
        transaction,
        walletAddress,
        signAndSendTransaction,
        connection,
      });
    } else {
      // Direct send on devnet (Gateway doesn't support devnet)
      console.log('📤 Sending directly (devnet fallback)...');

      // Pass the Transaction object (not serialized) - signing function will serialize it
      const signature = await signAndSendTransaction(transaction);

      result = {
        success: true,
        signature: typeof signature === 'string' ? signature : signature.signature,
      };
    }

    if (!result.success) {
      throw new Error(result.error || 'Transaction failed');
    }

    console.log('✅ Tokens retired successfully!');
    console.log(`📝 Signature: ${result.signature}`);
    console.log(`🔥 Burned ${amount} CO₂e tokens permanently`);

    return {
      success: true,
      signature: result.signature,
    };
  } catch (error: any) {
    console.error('❌ Error retiring CO₂e tokens:', error);
    return {
      success: false,
      error: error.message || 'Failed to retire tokens',
    };
  }
}

/**
 * Calculate retirement status for a certificate
 */
export function calculateRetirementStatus(
  totalEmissions: number,
  offsetAmount: number
): {
  status: 'not_offset' | 'partially_offset' | 'fully_offset';
  percentage: number;
  remaining: number;
} {
  const percentage = Math.min((offsetAmount / totalEmissions) * 100, 100);
  const remaining = Math.max(totalEmissions - offsetAmount, 0);

  let status: 'not_offset' | 'partially_offset' | 'fully_offset';
  if (offsetAmount === 0) {
    status = 'not_offset';
  } else if (offsetAmount >= totalEmissions) {
    status = 'fully_offset';
  } else {
    status = 'partially_offset';
  }

  return {
    status,
    percentage: Math.round(percentage * 10) / 10, // Round to 1 decimal
    remaining: Math.round(remaining * 100) / 100, // Round to 2 decimals
  };
}
