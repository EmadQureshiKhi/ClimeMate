import { Connection, PublicKey, Transaction, SystemProgram, TransactionInstruction } from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  getAccount,
} from '@solana/spl-token';
import * as anchor from '@coral-xyz/anchor';
import { Program, BN, Idl } from '@coral-xyz/anchor';
import idlJson from './idl/co2e_escrow.json';

// Extract the actual IDL object (Next.js might wrap it)
const idl = (idlJson as any).default || idlJson;

/**
 * CO₂e Escrow Integration
 * 
 * Real escrow program for instant token purchases
 * - Program: FsqvhRRiENRHLncK3GKMitZT1V126pXGpT2dtVEHhMkf
 * - Token: C9vBPNUk9ENVo5iEPY6LwBVoyNTGxZ7jU4uuqjGQde7D
 * - Multi-sig: 9N1PSX7VLnBtmAdUj4JNVdWQjZrvi8vHftJPLuRNjLWM
 * - Network: Devnet
 */

// Configuration
export const ESCROW_PROGRAM_ID = new PublicKey('FsqvhRRiENRHLncK3GKMitZT1V126pXGpT2dtVEHhMkf');
export const TOKEN_MINT = new PublicKey('C9vBPNUk9ENVo5iEPY6LwBVoyNTGxZ7jU4uuqjGQde7D');
export const MULTISIG_ADDRESS = new PublicKey('9N1PSX7VLnBtmAdUj4JNVdWQjZrvi8vHftJPLuRNjLWM');
export const TOKEN_DECIMALS = 2;

// Derive escrow PDA
export function getEscrowPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('escrow'), TOKEN_MINT.toBuffer()],
    ESCROW_PROGRAM_ID
  );
}

// Convert tokens to smallest unit
export function tokensToSmallestUnit(tokens: number): number {
  return Math.floor(tokens * Math.pow(10, TOKEN_DECIMALS));
}

// Convert smallest unit to tokens
export function smallestUnitToTokens(amount: number): number {
  return amount / Math.pow(10, TOKEN_DECIMALS);
}

/**
 * Get escrow state (price, stats, etc.)
 */
export async function getEscrowState(connection: Connection) {
  try {
    console.log('🔧 Creating provider...');
    const provider = new anchor.AnchorProvider(
      connection,
      {} as any,
      { commitment: 'confirmed' }
    );
    
    console.log('🔧 IDL type:', typeof idl);
    console.log('🔧 IDL keys:', Object.keys(idl));
    console.log('🔧 Program ID:', ESCROW_PROGRAM_ID.toString());
    console.log('🔧 IDL metadata:', (idl as any).metadata);
    
    // Use 'as any' to match the working test script approach
    console.log('🔧 Creating Program...');
    const program = new Program(idl as any, ESCROW_PROGRAM_ID, provider);
    console.log('✅ Program created successfully');
    
    const [escrowPDA] = getEscrowPDA();
    
    console.log('📊 Fetching escrow state from:', escrowPDA.toString());
    
    const escrowAccount: any = await program.account.escrow.fetch(escrowPDA);
    
    console.log('📊 Raw escrow account:', escrowAccount);
    
    // Safely extract values - Anchor returns BN objects
    const pricePerToken = escrowAccount.pricePerToken?.toNumber?.() ?? 0;
    const totalSold = escrowAccount.totalSold?.toNumber?.() ?? 0;
    const totalRevenue = escrowAccount.totalRevenue?.toNumber?.() ?? 0;
    
    console.log('📊 Parsed values:', {
      pricePerToken,
      totalSold: smallestUnitToTokens(totalSold),
      totalRevenue,
    });
    
    return {
      pricePerToken,
      totalSold: smallestUnitToTokens(totalSold),
      totalRevenue,
      admin: escrowAccount.admin?.toString() ?? '',
      tokenMint: escrowAccount.tokenMint?.toString() ?? '',
    };
  } catch (error: any) {
    console.error('❌ Error fetching escrow state:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      logs: error.logs,
    });
    throw error;
  }
}

/**
 * Get available tokens in escrow
 */
export async function getAvailableTokens(connection: Connection): Promise<number> {
  try {
    const [escrowPDA] = getEscrowPDA();
    const escrowTokenAccount = await getAssociatedTokenAddress(
      TOKEN_MINT,
      escrowPDA,
      true
    );
    
    const accountInfo = await getAccount(connection, escrowTokenAccount);
    return smallestUnitToTokens(Number(accountInfo.amount));
  } catch (error) {
    console.error('Error fetching available tokens:', error);
    return 0;
  }
}

/**
 * Buy CO₂e tokens from escrow
 * 
 * This is an atomic swap:
 * - User pays SOL → Multi-sig receives
 * - Escrow sends tokens → User receives
 * - Both happen or neither (atomic)
 */
export async function buyTokensFromEscrow(
  buyerWallet: string,
  amount: number, // in smallest units (e.g., 500 = 5.00 CO₂e)
  signAndSendTransaction: (tx: Transaction) => Promise<string>,
  connection: Connection
): Promise<{ success: boolean; signature?: string; error?: string }> {
  try {
    console.log('🛒 Buying CO₂e tokens from escrow...');
    console.log(`  Amount (smallest units): ${amount}`);
    console.log(`  Amount (tokens): ${smallestUnitToTokens(amount)} CO₂e`);

    const buyerPubkey = new PublicKey(buyerWallet);
    const [escrowPDA] = getEscrowPDA();

    // Get token accounts
    const escrowTokenAccount = await getAssociatedTokenAddress(
      TOKEN_MINT,
      escrowPDA,
      true
    );
    const buyerTokenAccount = await getAssociatedTokenAddress(
      TOKEN_MINT,
      buyerPubkey
    );

    // Get escrow state for price
    const escrowState = await getEscrowState(connection);
    const totalCost = (amount * escrowState.pricePerToken) / 100; // Adjust for decimals
    console.log(`  Price: ${escrowState.pricePerToken} lamports per token`);
    console.log(`  Total cost: ${totalCost / 1e9} SOL`);

    // Build transaction
    const transaction = new Transaction();

    // Check if buyer's token account exists
    let buyerAccountExists = false;
    try {
      await getAccount(connection, buyerTokenAccount);
      buyerAccountExists = true;
      console.log('  ✅ Token account exists');
    } catch {
      console.log('  📝 Creating token account...');
      transaction.add(
        createAssociatedTokenAccountInstruction(
          buyerPubkey,
          buyerTokenAccount,
          buyerPubkey,
          TOKEN_MINT
        )
      );
    }

    // Create program instance
    const provider = new anchor.AnchorProvider(
      connection,
      {} as any,
      { commitment: 'confirmed' }
    );
    const program = new Program(idl as any, ESCROW_PROGRAM_ID, provider);

    // Add buy_tokens instruction
    // IMPORTANT: Pass MULTISIG as admin so SOL goes there!
    console.log('🔧 Creating buy instruction with amount:', amount);
    console.log('🔧 BN value:', new BN(amount).toString());
    
    const buyIx = await program.methods
      .buyTokens(new BN(amount))
      .accounts({
        escrow: escrowPDA,
        buyer: buyerPubkey,
        admin: MULTISIG_ADDRESS, // 🔥 SOL goes to multi-sig!
        escrowTokenAccount: escrowTokenAccount,
        buyerTokenAccount: buyerTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .instruction();

    transaction.add(buyIx);

    // Add memo instruction for audit logging
    const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');
    const memoData = JSON.stringify({
      type: 'TOKEN_PURCHASE',
      action: 'BUY_CO2E_TOKENS',
      amount: amount,
      tokens: smallestUnitToTokens(amount),
      buyer: buyerWallet,
      timestamp: new Date().toISOString(),
      escrow: escrowPDA.toString(),
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
    transaction.feePayer = buyerPubkey;
    transaction.lastValidBlockHeight = lastValidBlockHeight;

    console.log('📤 Sending transaction...');

    // Sign and send
    const signature = await signAndSendTransaction(transaction);

    console.log('✅ Purchase complete!');
    console.log(`  Signature: ${signature}`);
    console.log(`  View: https://solscan.io/tx/${signature}?cluster=devnet`);

    return {
      success: true,
      signature,
    };
  } catch (error: any) {
    console.error('❌ Error buying tokens:', error);
    return {
      success: false,
      error: error.message || 'Failed to purchase tokens',
    };
  }
}

/**
 * Get user's CO₂e token balance
 */
export async function getUserTokenBalance(
  walletAddress: string,
  connection: Connection
): Promise<number> {
  try {
    const walletPubkey = new PublicKey(walletAddress);
    const tokenAccount = await getAssociatedTokenAddress(
      TOKEN_MINT,
      walletPubkey
    );
    
    const accountInfo = await getAccount(connection, tokenAccount);
    return smallestUnitToTokens(Number(accountInfo.amount));
  } catch (error) {
    // Account doesn't exist yet
    return 0;
  }
}

/**
 * Calculate purchase cost
 */
export async function calculatePurchaseCost(
  amount: number,
  connection: Connection
): Promise<{ costInLamports: number; costInSOL: number }> {
  try {
    const escrowState = await getEscrowState(connection);
    const costInLamports = (amount * escrowState.pricePerToken) / 100;
    const costInSOL = costInLamports / 1e9;
    
    return {
      costInLamports,
      costInSOL,
    };
  } catch (error) {
    console.error('Error calculating cost:', error);
    return {
      costInLamports: 0,
      costInSOL: 0,
    };
  }
}
