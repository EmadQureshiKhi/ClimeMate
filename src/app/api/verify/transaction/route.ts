import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';

const SOLANA_NETWORK = (process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet') as 'devnet' | 'testnet' | 'mainnet-beta';
const SOLANA_RPC = process.env.NEXT_PUBLIC_SOLANA_RPC || 'https://api.devnet.solana.com';

export async function POST(request: NextRequest) {
  try {
    const { transactionId } = await request.json();

    if (!transactionId) {
      return NextResponse.json(
        { error: 'Transaction ID is required' },
        { status: 400 }
      );
    }

    console.log('🔍 Fetching transaction:', transactionId);

    // Connect to Solana
    const connection = new Connection(SOLANA_RPC, 'confirmed');

    // Fetch transaction
    const transaction = await connection.getTransaction(transactionId, {
      maxSupportedTransactionVersion: 0,
    });

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    console.log('✅ Transaction found');
    console.log('📊 Transaction details:', {
      slot: transaction.slot,
      blockTime: transaction.blockTime,
      hasInstructions: !!transaction.transaction.message.instructions,
      instructionCount: transaction.transaction.message.instructions?.length,
      hasLogs: !!transaction.meta?.logMessages,
      logCount: transaction.meta?.logMessages?.length,
    });

    const result: any = {
      transactionId,
      blockTime: transaction.blockTime,
      slot: transaction.slot,
    };

    // Parse memo instructions (certificate log)
    // Also check log messages for memo data
    if (transaction.meta?.logMessages) {
      console.log('📋 Checking log messages...');
      for (const log of transaction.meta.logMessages) {
        // Look for memo program logs
        if (log.includes('Program log:') || log.includes('Memo')) {
          console.log('📝 Found log:', log);
          
          // Try to extract JSON from the log
          try {
            // Look for JSON pattern in the log
            const jsonMatch = log.match(/\{.*\}/);
            if (jsonMatch) {
              const certificateLog = JSON.parse(jsonMatch[0]);
              if (certificateLog.type === 'CARBON_CERTIFICATE') {
                result.certificateLog = certificateLog;
                console.log('✅ Certificate log parsed from logs');
                break;
              }
            }
          } catch (e) {
            // Not JSON, continue
          }
        }
      }
    }

    // Also try parsing from instructions
    if (!result.certificateLog && transaction.transaction.message.instructions) {
      const MEMO_PROGRAM_ID = 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr';
      
      for (const instruction of transaction.transaction.message.instructions) {
        try {
          // Get program ID
          const programIdIndex = instruction.programIdIndex;
          const accountKeys = transaction.transaction.message.staticAccountKeys || 
                             transaction.transaction.message.accountKeys;
          const programId = accountKeys[programIdIndex].toBase58();

          console.log('🔍 Checking instruction from program:', programId);

          // Check if it's a memo instruction
          if (programId === MEMO_PROGRAM_ID) {
            // Parse memo data - try different encodings
            let memoData: string;
            
            if (typeof instruction.data === 'string') {
              // Base58 encoded
              try {
                const decoded = bs58.decode(instruction.data);
                memoData = Buffer.from(decoded).toString('utf-8');
              } catch {
                memoData = instruction.data;
              }
            } else if (Buffer.isBuffer(instruction.data)) {
              memoData = instruction.data.toString('utf-8');
            } else if (Array.isArray(instruction.data)) {
              memoData = Buffer.from(instruction.data).toString('utf-8');
            } else {
              memoData = String(instruction.data);
            }

            console.log('📝 Found memo data:', memoData.substring(0, 100));

            try {
              // Try to parse as JSON (certificate log)
              const certificateLog = JSON.parse(memoData);
              if (certificateLog.type === 'CARBON_CERTIFICATE') {
                result.certificateLog = certificateLog;
                console.log('✅ Certificate log parsed from instruction');
                break;
              }
            } catch (e) {
              console.log('⚠️ Memo is not certificate JSON');
            }
          }
        } catch (e) {
          console.error('Error parsing instruction:', e);
        }
      }
    }

    // Try to parse NFT metadata from transaction
    // Look for metadata in the transaction (if it's an NFT mint)
    if (transaction.meta?.logMessages) {
      for (const log of transaction.meta.logMessages) {
        // Check for metadata URI in logs
        if (log.includes('data:application/json')) {
          try {
            const match = log.match(/data:application\/json;base64,([A-Za-z0-9+/=]+)/);
            if (match) {
              const base64Data = match[1];
              const jsonString = Buffer.from(base64Data, 'base64').toString('utf-8');
              const metadata = JSON.parse(jsonString);
              result.nftMetadata = metadata;
              console.log('✅ NFT metadata parsed');
              break;
            }
          } catch (e) {
            console.error('Error parsing NFT metadata:', e);
          }
        }
      }
    }

    // Add debug info if nothing found
    if (!result.certificateLog && !result.nftMetadata) {
      console.log('⚠️ No certificate data found');
      console.log('📋 All log messages:', transaction.meta?.logMessages);
      
      // Return logs for debugging
      result.debug = {
        logs: transaction.meta?.logMessages || [],
        instructionCount: transaction.transaction.message.instructions?.length || 0,
      };
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('❌ Error fetching transaction:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transaction', details: error.message },
      { status: 500 }
    );
  }
}
