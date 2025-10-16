import { Connection, PublicKey, Transaction, SystemProgram, TransactionInstruction } from '@solana/web3.js';
import bs58 from 'bs58';

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
 * This is a simplified version - in production, you'd use Metaplex
 */
export async function mintCertificateNFT(
  walletAddress: string,
  certificateData: CertificateMetadata,
  signAndSendTransaction: (transaction: any) => Promise<{ signature: string }>
): Promise<NFTMintResult> {
  try {
    console.log('🎨 Starting NFT mint process...');
    
    // Create metadata
    const metadata = createCertificateMetadata(certificateData);
    console.log('📝 Metadata created:', metadata);
    
    // Upload metadata (mock for now)
    const metadataUri = await uploadMetadata(metadata);
    console.log('📤 Metadata uploaded:', metadataUri);
    
    // For demo purposes, we'll create a simple transaction
    // In production, use Metaplex to mint actual NFT
    const connection = new Connection(SOLANA_RPC, 'confirmed');
    
    // Create a simple memo transaction (placeholder for NFT mint)
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: new PublicKey(walletAddress),
        toPubkey: new PublicKey(walletAddress), // Self-transfer for demo
        lamports: 1000, // Small amount for demo (0.000001 SOL)
      })
    );
    
    // Get recent blockhash
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = new PublicKey(walletAddress);
    transaction.lastValidBlockHeight = lastValidBlockHeight;
    
    console.log('📦 Transaction created, serializing...');
    
    // Serialize transaction for Privy wallet
    const serializedTransaction = transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    });
    
    console.log('✍️ Signing and sending transaction...');
    
    // Sign and send transaction using Privy wallet
    // Privy's signAndSendTransaction already sends the transaction to the network
    const result = await signAndSendTransaction({
      transaction: serializedTransaction,
      chain: `solana:${SOLANA_NETWORK}`,
    });
    
    console.log('✅ Transaction result:', result);
    
    // Extract and convert signature - Privy returns it as a Buffer
    let signature: string;
    
    if (typeof result === 'string') {
      // Already a string
      signature = result;
    } else if (result && typeof result === 'object') {
      const sig = (result as any).signature;
      
      if (typeof sig === 'string') {
        signature = sig;
      } else if (sig && typeof sig === 'object' && sig.type === 'Buffer' && Array.isArray(sig.data)) {
        // Convert Buffer to base58 string (Solana signature format)
        const buffer = Buffer.from(sig.data);
        signature = bs58.encode(buffer);
        console.log('✅ Converted Buffer to base58 signature:', signature);
      } else if (Buffer.isBuffer(sig)) {
        // Direct Buffer object
        signature = bs58.encode(sig);
        console.log('✅ Converted Buffer to base58 signature:', signature);
      } else {
        throw new Error(`Invalid signature format: ${JSON.stringify(sig)}`);
      }
    } else {
      throw new Error(`Invalid result format: ${JSON.stringify(result)}`);
    }
    
    if (!signature || typeof signature !== 'string') {
      throw new Error(`Failed to extract signature from result: ${JSON.stringify(result)}`);
    }
    
    console.log('✅ Transaction signature:', signature);
    
    // Transaction is already sent and confirmed by Privy
    // No need to manually confirm
    console.log('✅ Transaction completed!');
    
    // For now, use the transaction signature as the NFT identifier
    // In production with Metaplex, this would be the actual mint address
    const nftAddress = signature;
    
    return {
      success: true,
      nftAddress,
      transactionSignature: signature,
      metadataUri,
    };
  } catch (error: any) {
    console.error('❌ Error minting NFT:', error);
    return {
      success: false,
      error: error.message || 'Failed to mint NFT',
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
  certificateData: {
    certificateId: string;
    dataHash: string;
    totalEmissions: number;
    breakdown: Record<string, number>;
    timestamp: string;
  },
  signAndSendTransaction: (transaction: any) => Promise<{ signature: string }>
): Promise<{ success: boolean; signature?: string; error?: string }> {
  try {
    console.log('📝 Logging certificate on Solana blockchain...');
    
    // Create log message
    const logMessage = {
      type: 'CARBON_CERTIFICATE',
      version: '1.0',
      certificateId: certificateData.certificateId,
      dataHash: certificateData.dataHash,
      totalEmissions: certificateData.totalEmissions,
      breakdown: certificateData.breakdown,
      timestamp: certificateData.timestamp,
    };
    
    const logString = JSON.stringify(logMessage);
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
    
    console.log('📦 Memo transaction created, serializing...');
    
    // Serialize transaction
    const serializedTransaction = transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    });
    
    console.log('✍️ Signing and sending memo transaction...');
    
    // Sign and send transaction
    const result = await signAndSendTransaction({
      transaction: serializedTransaction,
      chain: `solana:${SOLANA_NETWORK}`,
    });
    
    // Extract signature
    let signature: string;
    
    if (typeof result === 'string') {
      signature = result;
    } else if (result && typeof result === 'object') {
      const sig = (result as any).signature;
      
      if (typeof sig === 'string') {
        signature = sig;
      } else if (sig && typeof sig === 'object' && sig.type === 'Buffer' && Array.isArray(sig.data)) {
        const buffer = Buffer.from(sig.data);
        signature = bs58.encode(buffer);
      } else if (Buffer.isBuffer(sig)) {
        signature = bs58.encode(sig);
      } else {
        throw new Error(`Invalid signature format: ${JSON.stringify(sig)}`);
      }
    } else {
      throw new Error(`Invalid result format: ${JSON.stringify(result)}`);
    }
    
    console.log('✅ Certificate logged on-chain! Signature:', signature);
    console.log('🔍 View on Solscan:', getExplorerUrl(signature));
    
    return {
      success: true,
      signature,
    };
  } catch (error: any) {
    console.error('❌ Error logging certificate on-chain:', error);
    return {
      success: false,
      error: error.message || 'Failed to log certificate',
    };
  }
}
