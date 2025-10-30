import { Connection, PublicKey, Transaction, SystemProgram, TransactionInstruction } from '@solana/web3.js';
import bs58 from 'bs58';
import { sendTransactionWithGateway, buildGatewayTransaction, logGatewayIntegration } from './sanctum-gateway';

// Solana configuration
const SOLANA_NETWORK = (process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet') as 'devnet' | 'testnet' | 'mainnet-beta';
const SOLANA_RPC = process.env.NEXT_PUBLIC_SOLANA_RPC || 'https://api.devnet.solana.com';

console.log('🌐 Solana Network:', SOLANA_NETWORK);
console.log('🔗 Solana RPC:', SOLANA_RPC);

export interface CertificateMetadata {
  certificateId: string;
  title: string;
  totalEmissions: number;
  breakdown: Record<string, number>;
  issueDate: string;
  organizationName?: string;
}

export interface NFTMintResult {
  success: boolean;
  nftAddress?: string;
  transactionSignature?: string;
  metadataUri?: string;
  error?: string;
}

/**
 * Create certificate metadata for NFT
 */
export function createCertificateMetadata(data: CertificateMetadata) {
  return {
    name: `Carbon Certificate ${data.certificateId}`,
    symbol: 'CARBON',
    description: `Verified carbon emissions certificate for ${data.totalEmissions.toFixed(2)} kg CO₂e. Issued on ${new Date(data.issueDate).toLocaleDateString()}.`,
    image: 'https://i.ibb.co/dwzM2KLM/Untitled-design-removebg-preview.png', // Your logo
    attributes: [
      {
        trait_type: 'Certificate ID',
        value: data.certificateId,
      },
      {
        trait_type: 'Total Emissions',
        value: `${data.totalEmissions.toFixed(2)} kg CO₂e`,
      },
      {
        trait_type: 'Issue Date',
        value: data.issueDate,
      },
      {
        trait_type: 'Organization',
        value: data.organizationName || 'ClimeMate User',
      },
      ...Object.entries(data.breakdown).map(([category, amount]) => ({
        trait_type: `${category} Emissions`,
        value: `${Number(amount).toFixed(2)} kg CO₂e`,
      })),
    ],
    properties: {
      category: 'Carbon Certificate',
      files: [
        {
          uri: 'https://i.ibb.co/dwzM2KLM/Untitled-design-removebg-preview.png',
          type: 'image/png',
        },
      ],
    },
  };
}

/**
 * Upload metadata to IPFS/Arweave (simplified version)
 * In production, you'd use a proper storage solution
 */
export async function uploadMetadata(metadata: any): Promise<string> {
  // For now, we'll use a mock URI
  // In production, upload to IPFS/Arweave
  const metadataString = JSON.stringify(metadata);
  const base64 = Buffer.from(metadataString).toString('base64');

  // Mock URI - in production, replace with actual IPFS/Arweave upload
  return `data:application/json;base64,${base64}`;
}

/**
 * Mint NFT certificate on Solana
 * Creates a transaction with certificate data
 * Note: Full Metaplex NFT minting requires additional setup and is complex with Privy
 * This creates a verifiable on-chain record. For production, consider using a backend service
 * to mint actual NFTs with Metaplex and transfer them to the user.
 */
export async function mintCertificateNFT(
  walletAddress: string,
  certificateData: CertificateMetadata,
  signAndSendTransaction: (transaction: any) => Promise<{ signature: string }>
): Promise<NFTMintResult> {
  try {
    console.log('🎨 Starting certificate NFT process...');

    // Create metadata
    const metadata = createCertificateMetadata(certificateData);
    console.log('📝 Metadata created:', metadata);

    // Upload metadata
    const metadataUri = await uploadMetadata(metadata);
    console.log('📤 Metadata uploaded:', metadataUri);

    const connection = new Connection(SOLANA_RPC, 'confirmed');

    // Create a transaction with memo containing NFT metadata
    // This creates an on-chain record that can be verified
    const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');

    const memoData = JSON.stringify({
      type: 'NFT_CERTIFICATE',
      certificateId: certificateData.certificateId,
      name: metadata.name,
      symbol: metadata.symbol,
      uri: metadataUri,
      timestamp: new Date().toISOString(),
    });

    const memoInstruction = new TransactionInstruction({
      keys: [],
      programId: MEMO_PROGRAM_ID,
      data: Buffer.from(memoData, 'utf-8'),
    });

    // Add a small transfer to make it a valid transaction
    const transaction = new Transaction().add(
      memoInstruction,
      SystemProgram.transfer({
        fromPubkey: new PublicKey(walletAddress),
        toPubkey: new PublicKey(walletAddress),
        lamports: 1000, // 0.000001 SOL
      })
    );

    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = new PublicKey(walletAddress);
    transaction.lastValidBlockHeight = lastValidBlockHeight;

    console.log('📦 Transaction created, using Gateway for optimal delivery...');

    // Send via Gateway for better delivery and cost savings
    const gatewayResult = await sendTransactionWithGateway({
      transaction,
      walletAddress,
      signAndSendTransaction,
      connection,
    });

    if (!gatewayResult.success) {
      throw new Error(gatewayResult.error || 'Gateway transaction failed');
    }

    const signature = gatewayResult.signature!;
    console.log('✅ Transaction sent via Gateway:', signature);
    console.log('💰 Cost savings:', gatewayResult.costSavings, 'lamports');

    console.log('✅ Certificate NFT transaction completed!');
    console.log('📝 Transaction:', signature);
    console.log('💡 Note: This creates an on-chain record. For visual NFTs in wallets, consider using a backend minting service.');

    return {
      success: true,
      nftAddress: signature, // Using transaction signature as identifier
      transactionSignature: signature,
      metadataUri,
    };
  } catch (error: any) {
    console.error('❌ Error creating certificate NFT:', error);
    return {
      success: false,
      error: error.message || 'Failed to create certificate NFT',
    };
  }
}



/**
 * Get Solana explorer URL for transaction
 */
export function getExplorerUrl(signature: string, cluster?: 'mainnet-beta' | 'devnet' | 'testnet'): string {
  const network = cluster || SOLANA_NETWORK;
  if (network === 'mainnet-beta') {
    return `https://explorer.solana.com/tx/${signature}`;
  }
  return `https://explorer.solana.com/tx/${signature}?cluster=${network}`;
}

/**
 * Get Solana explorer URL for NFT (using transaction signature)
 */
export function getNFTExplorerUrl(transactionSignature: string, cluster?: 'mainnet-beta' | 'devnet' | 'testnet'): string {
  // Since we're storing the transaction signature, use the same URL as getExplorerUrl
  return getExplorerUrl(transactionSignature, cluster);
}

/**
 * Log certificate creation on Solana blockchain using memo instruction
 * This creates an immutable audit trail visible on Solscan
 */
export async function logCertificateOnChain(
  walletAddress: string,
  logData: any, // Accept any data structure for flexibility
  signAndSendTransaction: (transaction: any) => Promise<{ signature: string }>
): Promise<{ success: boolean; signature?: string; error?: string }> {
  try {
    console.log('📝 Logging data on Solana blockchain...');

    // Log Gateway integration
    logGatewayIntegration();

    // Use the provided log data directly (already formatted by caller)
    const logString = JSON.stringify(logData);
    console.log('📋 Log message:', logString);

    // Create connection
    const connection = new Connection(SOLANA_RPC, 'confirmed');

    // Create memo instruction
    // Memo program ID: MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr
    const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');

    const memoInstruction = new TransactionInstruction({
      keys: [],
      programId: MEMO_PROGRAM_ID,
      data: Buffer.from(logString, 'utf-8'),
    });

    // Create transaction with memo
    const transaction = new Transaction().add(memoInstruction);

    // Get recent blockhash
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = new PublicKey(walletAddress);
    transaction.lastValidBlockHeight = lastValidBlockHeight;

    console.log('📦 Memo transaction created, using Gateway for optimal delivery...');

    // Send via Gateway for better delivery and cost savings
    const gatewayResult = await sendTransactionWithGateway({
      transaction,
      walletAddress,
      signAndSendTransaction,
      connection,
    });

    if (!gatewayResult.success) {
      throw new Error(gatewayResult.error || 'Gateway transaction failed');
    }

    console.log('✅ Certificate logged on-chain via Gateway!');
    console.log('📝 Signature:', gatewayResult.signature);
    console.log('💰 Cost savings:', gatewayResult.costSavings, 'lamports');
    console.log('🔍 View on Solscan:', getExplorerUrl(gatewayResult.signature!));

    return {
      success: true,
      signature: gatewayResult.signature,
    };
  } catch (error: any) {
    console.error('❌ Error logging certificate on-chain:', error);
    return {
      success: false,
      error: error.message || 'Failed to log certificate',
    };
  }
}
