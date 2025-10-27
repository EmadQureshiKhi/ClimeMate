import { Connection, PublicKey, Transaction, SystemProgram, TransactionInstruction } from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getAssociatedTokenAddress,
  getAccount,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { sendTransactionWithGateway } from './sanctum-gateway';

/**
 * ClimeMate Offset Token (CO₂e) System
 * 
 * Real SPL Token Implementation:
 * - Token: ClimeMate Offset Token
 * - Symbol: CO₂e
 * - Mint: C9vBPNUk9ENVo5iEPY6LwBVoyNTGxZ7jU4uuqjGQde7D
 * - Decimals: 2
 * - 1 CO₂e = 1 kg CO₂ equivalent offset
 * - Multi-sig protected (2-of-3)
 * - All transactions via Gateway
 */

const SOLANA_NETWORK = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet';
const SOLANA_RPC = process.env.NEXT_PUBLIC_SOLANA_RPC || 'https://api.devnet.solana.com';

// CO₂e Token Mint Address (created with multi-sig)
export const CO2E_MINT = new PublicKey(
  process.env.NEXT_PUBLIC_CO2E_MINT || 'C9vBPNUk9ENVo5iEPY6LwBVoyNTGxZ7jU4uuqjGQde7D'
);

// Token decimals
export const CO2E_DECIMALS = parseInt(process.env.NEXT_PUBLIC_CO2E_DECIMALS || '2');

// Convert tokens to smallest unit (with decimals)
export function tokensToSmallestUnit(tokens: number): bigint {
  return BigInt(Math.floor(tokens * Math.pow(10, CO2E_DECIMALS)));
}

// Convert smallest unit to tokens
export function smallestUnitToTokens(amount: bigint): number {
  return Number(amount) / Math.pow(10, CO2E_DECIMALS);
}

export interface CarbonProject {
  id: string;
  name: string;
  type: 'solar' | 'wind' | 'reforestation' | 'ocean' | 'direct-air-capture';
  location: string;
  description: string;
  pricePerToken: number; // in lamports (SOL)
  availableSupply: number; // in tokens
  totalOffset: number; // total kg CO₂e offset
  verificationStandard: string;
  image: string;
  // For real implementation
  projectWallet?: string; // Where SOL payments go
  tokenAccount?: string; // Where CO₂e tokens come from
}

/**
 * Get user's CO₂e token balance
 */
export async function getCO2eBalance(
  walletAddress: string,
  connection: Connection
): Promise<number> {
  try {
    const walletPubkey = new PublicKey(walletAddress);
    
    // Get associated token account address
    const tokenAccount = await getAssociatedTokenAddress(
      CO2E_MINT,
      walletPubkey
    );
    
    // Get account info
    const accountInfo = await getAccount(connection, tokenAccount);
    
    // Convert from smallest unit to tokens
    return smallestUnitToTokens(accountInfo.amount);
  } catch (error) {
    // Account doesn't exist yet or other error
    console.log('No CO₂e balance found:', error);
    return 0;
  }
}

/**
 * Buy CO₂e tokens from a carbon project
 * 
 * For demo/hackathon:
 * 1. Transfer SOL from buyer to project wallet (payment)
 * 2. Log purchase on-chain via memo
 * 3. Project owner manually distributes tokens later
 * 
 * For production:
 * - Use escrow program
 * - Atomic swap (SOL for tokens)
 * - Or use project-controlled wallet to sign token transfer
 */
export async function buyCO2eTokens(
  buyerWallet: string,
  projectWallet: string,
  projectTokenAccount: string,
  amount: number, // in tokens
  pricePerToken: number, // in lamports
  signAndSendTransaction: (tx: any) => Promise<any>,
  connection: Connection
): Promise<{ success: boolean; signature?: string; error?: string }> {
  try {
    console.log('🛒 Purchasing CO₂e tokens...');
    console.log(`  Amount: ${amount} CO₂e`);
    console.log(`  Price: ${pricePerToken} lamports per token`);
    console.log(`  Total: ${amount * pricePerToken} lamports`);

    const buyerPubkey = new PublicKey(buyerWallet);
    const projectPubkey = new PublicKey(projectWallet);

    // Get buyer's token account (create if doesn't exist)
    const buyerTokenAccount = await getAssociatedTokenAddress(
      CO2E_MINT,
      buyerPubkey
    );

    const transaction = new Transaction();

    // Check if buyer's token account exists
    try {
      await getAccount(connection, buyerTokenAccount);
      console.log('  ✅ Token account exists');
    } catch {
      // Account doesn't exist, create it
      console.log('  📝 Creating token account for buyer...');
      transaction.add(
        createAssociatedTokenAccountInstruction(
          buyerPubkey,
          buyerTokenAccount,
          buyerPubkey,
          CO2E_MINT
        )
      );
    }

    // Transfer SOL from buyer to project (payment)
    const totalPrice = amount * pricePerToken;
    console.log(`  💰 Transferring ${totalPrice} lamports to project...`);
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: buyerPubkey,
        toPubkey: projectPubkey,
        lamports: totalPrice,
      })
    );

    // Add memo for logging the purchase
    const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');
    const memoData = JSON.stringify({
      type: 'CO2E_PURCHASE',
      buyer: buyerWallet,
      amount,
      pricePerToken,
      totalPrice,
      projectWallet,
      timestamp: new Date().toISOString(),
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
    transaction.feePayer = buyerPubkey;
    transaction.lastValidBlockHeight = lastValidBlockHeight;

    console.log('📦 Transaction built, sending via Gateway...');

    // Send via Gateway for optimal delivery
    const result = await sendTransactionWithGateway({
      transaction,
      walletAddress: buyerWallet,
      signAndSendTransaction,
      connection,
    });

    if (!result.success) {
      throw new Error(result.error || 'Transaction failed');
    }

    console.log('✅ Purchase recorded on-chain!');
    console.log(`📝 Signature: ${result.signature}`);
    console.log(`💡 Note: Project owner will distribute ${amount} CO₂e tokens to your wallet`);
    console.log(`   Your token account: ${buyerTokenAccount.toString()}`);

    return {
      success: true,
      signature: result.signature,
    };
  } catch (error: any) {
    console.error('❌ Error purchasing CO₂e tokens:', error);
    return {
      success: false,
      error: error.message || 'Failed to purchase tokens',
    };
  }
}

/**
 * Get available carbon projects
 * 
 * For now, returns mock data
 * In production, fetch from database with real project wallets
 */
export function getCarbonProjects(): CarbonProject[] {
  // For demo, we'll use your wallet as the project wallet
  // In production, each project would have its own wallet
  const demoProjectWallet = 'GjyjvJLfrNxT5FdzruCiSRK1xDqmnJHYdAxiahbyxc29';
  const demoTokenAccount = '4irfQhx1iuZLA582DEsx9imWP1YHTpLJ6RVU7MFpJaXD';

  return [
    {
      id: 'solar-farm-1',
      name: 'Rajasthan Solar Farm',
      type: 'solar',
      location: 'Rajasthan, India',
      description: '500 MW solar farm providing clean energy to 200,000 homes',
      pricePerToken: 50000, // 0.00005 SOL per token
      availableSupply: 100000, // 100K tokens available
      totalOffset: 500000, // 500K kg CO₂e total
      verificationStandard: 'Gold Standard',
      image: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=1200&q=100',
      projectWallet: demoProjectWallet,
      tokenAccount: demoTokenAccount,
    },
    {
      id: 'wind-energy-1',
      name: 'North Sea Wind Farm',
      type: 'wind',
      location: 'North Sea, Europe',
      description: '800 MW offshore wind farm powering 500,000 homes',
      pricePerToken: 60000,
      availableSupply: 80000,
      totalOffset: 400000,
      verificationStandard: 'Verra VCS',
      image: 'https://images.unsplash.com/photo-1532601224476-15c79f2f7a51?w=1200&q=100',
      projectWallet: demoProjectWallet,
      tokenAccount: demoTokenAccount,
    },
    {
      id: 'reforestation-1',
      name: 'Amazon Reforestation',
      type: 'reforestation',
      location: 'Amazon Rainforest, Brazil',
      description: 'Planting 1 million trees to restore degraded rainforest',
      pricePerToken: 40000,
      availableSupply: 50000,
      totalOffset: 250000,
      verificationStandard: 'Plan Vivo',
      image: 'https://images.pexels.com/photos/975771/pexels-photo-975771.jpeg?auto=compress&cs=tinysrgb&w=1200&dpr=2',
      projectWallet: demoProjectWallet,
      tokenAccount: demoTokenAccount,
    },
    {
      id: 'ocean-cleanup-1',
      name: 'Pacific Ocean Cleanup',
      type: 'ocean',
      location: 'Pacific Ocean',
      description: 'Removing plastic waste and restoring marine ecosystems',
      pricePerToken: 70000,
      availableSupply: 30000,
      totalOffset: 150000,
      verificationStandard: 'Blue Carbon',
      image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1200&q=100',
      projectWallet: demoProjectWallet,
      tokenAccount: demoTokenAccount,
    },
    {
      id: 'dac-1',
      name: 'Direct Air Capture Facility',
      type: 'direct-air-capture',
      location: 'Iceland',
      description: 'Capturing CO₂ directly from the atmosphere using renewable energy',
      pricePerToken: 100000,
      availableSupply: 20000,
      totalOffset: 100000,
      verificationStandard: 'ISO 14064',
      image: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=1200&q=100',
      projectWallet: demoProjectWallet,
      tokenAccount: demoTokenAccount,
    },
    {
      id: 'agriculture-1',
      name: 'Sustainable Agriculture',
      type: 'reforestation',
      location: 'USA',
      description: 'Supporting farmers in adopting regenerative agriculture techniques to sequester carbon in soil, improve soil health, and enhance biodiversity',
      pricePerToken: 45000,
      availableSupply: 60000,
      totalOffset: 300000,
      verificationStandard: 'Climate Action Reserve',
      image: 'https://images.pexels.com/photos/145930/pexels-photo-145930.jpeg?auto=compress&cs=tinysrgb&w=1200&dpr=2',
      projectWallet: demoProjectWallet,
      tokenAccount: demoTokenAccount,
    },
    {
      id: 'ocean-plastic-1',
      name: 'Ocean Plastic Cleanup',
      type: 'ocean',
      location: 'Indonesia',
      description: 'Removing plastic waste from coastal areas and open ocean, protecting marine life and restoring ecosystems',
      pricePerToken: 55000,
      availableSupply: 40000,
      totalOffset: 200000,
      verificationStandard: 'Plastic Bank',
      image: 'https://images.pexels.com/photos/1032650/pexels-photo-1032650.jpeg?auto=compress&cs=tinysrgb&w=1200&dpr=2',
      projectWallet: demoProjectWallet,
      tokenAccount: demoTokenAccount,
    },
    {
      id: 'wind-farm-2',
      name: 'Wind Farm Development',
      type: 'wind',
      location: 'Germany',
      description: 'Construction of new wind energy facilities to provide clean, renewable power to local communities and reduce reliance on fossil fuels',
      pricePerToken: 65000,
      availableSupply: 70000,
      totalOffset: 350000,
      verificationStandard: 'TÜV SÜD',
      image: 'https://images.pexels.com/photos/1118873/pexels-photo-1118873.jpeg?auto=compress&cs=tinysrgb&w=1200&dpr=2',
      projectWallet: demoProjectWallet,
      tokenAccount: demoTokenAccount,
    },
  ];
}

/**
 * Calculate offset needed for emissions
 */
export function calculateOffsetNeeded(emissions: number): {
  tokensNeeded: number;
  costEstimate: number;
} {
  // 1 token = 1 kg CO₂e
  const tokensNeeded = Math.ceil(emissions);
  
  // Average price across projects
  const projects = getCarbonProjects();
  const avgPrice = projects.reduce((sum, p) => sum + p.pricePerToken, 0) / projects.length;
  const costEstimate = tokensNeeded * avgPrice;

  return {
    tokensNeeded,
    costEstimate,
  };
}
