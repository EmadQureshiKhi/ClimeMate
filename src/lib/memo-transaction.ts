import { Connection, PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';

const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');

/**
 * Create a memo-only transaction for user to sign
 * This creates an audit trail before backend processes the actual reward transfer
 */
export async function createMemoTransaction(
  userWallet: string,
  memoData: Record<string, any>,
  connection: Connection
): Promise<Transaction> {
  const userPubkey = new PublicKey(userWallet);
  
  // Create memo instruction
  const memoIx = new TransactionInstruction({
    keys: [],
    programId: MEMO_PROGRAM_ID,
    data: Buffer.from(JSON.stringify(memoData), 'utf-8'),
  });
  
  // Create transaction with just the memo
  const transaction = new Transaction().add(memoIx);
  
  // Get recent blockhash
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = userPubkey;
  transaction.lastValidBlockHeight = lastValidBlockHeight;
  
  return transaction;
}

/**
 * Sign and send a memo transaction
 */
export async function signAndSendMemo(
  memoData: Record<string, any>,
  userWallet: string,
  signAndSendTransaction: (tx: Transaction) => Promise<string>,
  connection: Connection
): Promise<{ success: boolean; signature?: string; error?: string }> {
  try {
    console.log('📝 Creating memo transaction...');
    console.log('   Data:', memoData);
    
    const transaction = await createMemoTransaction(userWallet, memoData, connection);
    
    console.log('✍️  Requesting user signature...');
    const signature = await signAndSendTransaction(transaction);
    
    console.log('✅ Memo transaction signed and sent');
    console.log(`   Signature: ${signature}`);
    
    // Wait for confirmation
    await connection.confirmTransaction(signature, 'confirmed');
    console.log('✅ Memo transaction confirmed');
    
    return {
      success: true,
      signature,
    };
  } catch (error: any) {
    console.error('❌ Error with memo transaction:', error);
    return {
      success: false,
      error: error.message || 'Failed to sign memo transaction',
    };
  }
}
