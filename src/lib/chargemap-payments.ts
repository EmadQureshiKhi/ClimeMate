import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';

const TREASURY_WALLET = process.env.NEXT_PUBLIC_TREASURY_WALLET || 'YOUR_TREASURY_WALLET';

export interface PlotPurchaseParams {
  buyerPublicKey: PublicKey;
  priceSol: number;
  h3Index: string;
}

export interface ChargerInstallParams {
  ownerPublicKey: PublicKey;
  costSol: number;
  plotId: number;
  level: number;
}

/**
 * Create a transaction to purchase a plot
 */
export async function createPlotPurchaseTransaction(
  connection: Connection,
  params: PlotPurchaseParams
): Promise<Transaction> {
  const { buyerPublicKey, priceSol } = params;
  
  const treasuryPublicKey = new PublicKey(TREASURY_WALLET);
  const lamports = Math.floor(priceSol * LAMPORTS_PER_SOL);

  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: buyerPublicKey,
      toPubkey: treasuryPublicKey,
      lamports,
    })
  );

  // Get recent blockhash
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = buyerPublicKey;
  transaction.lastValidBlockHeight = lastValidBlockHeight;

  return transaction;
}

/**
 * Create a transaction to install/upgrade a charger
 */
export async function createChargerInstallTransaction(
  connection: Connection,
  params: ChargerInstallParams
): Promise<Transaction> {
  const { ownerPublicKey, costSol } = params;
  
  const treasuryPublicKey = new PublicKey(TREASURY_WALLET);
  const lamports = Math.floor(costSol * LAMPORTS_PER_SOL);

  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: ownerPublicKey,
      toPubkey: treasuryPublicKey,
      lamports,
    })
  );

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = ownerPublicKey;
  transaction.lastValidBlockHeight = lastValidBlockHeight;

  return transaction;
}

/**
 * Verify a transaction was successful
 */
export async function verifyTransaction(
  connection: Connection,
  signature: string
): Promise<boolean> {
  try {
    const confirmation = await connection.confirmTransaction(signature, 'confirmed');
    return !confirmation.value.err;
  } catch (error) {
    console.error('Error verifying transaction:', error);
    return false;
  }
}

/**
 * Get SOL balance for a wallet
 */
export async function getWalletBalance(
  connection: Connection,
  publicKey: PublicKey
): Promise<number> {
  try {
    const balance = await connection.getBalance(publicKey);
    return balance / LAMPORTS_PER_SOL;
  } catch (error) {
    console.error('Error getting wallet balance:', error);
    return 0;
  }
}

/**
 * Format SOL amount for display
 */
export function formatSOL(amount: number): string {
  return `${amount.toFixed(4)} SOL`;
}

/**
 * Convert lamports to SOL
 */
export function lamportsToSOL(lamports: number): number {
  return lamports / LAMPORTS_PER_SOL;
}

/**
 * Convert SOL to lamports
 */
export function solToLamports(sol: number): number {
  return Math.floor(sol * LAMPORTS_PER_SOL);
}
