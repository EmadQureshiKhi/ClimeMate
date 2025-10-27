import { useState, useEffect } from 'react';
import { Connection, Transaction } from '@solana/web3.js';
import { useAuth } from '@/hooks/useAuth';
import bs58 from 'bs58';
import {
  buyTokensFromEscrow,
  getEscrowState,
  getAvailableTokens,
  getUserTokenBalance,
  calculatePurchaseCost,
  tokensToSmallestUnit,
  smallestUnitToTokens,
} from '@/lib/co2e-escrow';

export function useEscrow() {
  // Use Privy wallet instead of standard wallet adapter
  const { walletAddress, solanaWallet } = useAuth();
  const [loading, setLoading] = useState(false);
  const [escrowState, setEscrowState] = useState<any>(null);
  const [availableTokens, setAvailableTokens] = useState<number>(0);
  const [userBalance, setUserBalance] = useState<number>(0);
  
  // Create connection
  const connection = new Connection(
    process.env.NEXT_PUBLIC_SOLANA_RPC || 'https://api.devnet.solana.com',
    'confirmed'
  );

  // Fetch escrow state
  const fetchEscrowState = async () => {
    try {
      const state = await getEscrowState(connection);
      setEscrowState(state);
    } catch (error) {
      console.error('Error fetching escrow state:', error);
    }
  };

  // Fetch available tokens
  const fetchAvailableTokens = async () => {
    try {
      const tokens = await getAvailableTokens(connection);
      setAvailableTokens(tokens);
    } catch (error) {
      console.error('Error fetching available tokens:', error);
    }
  };

  // Fetch user balance
  const fetchUserBalance = async () => {
    if (!walletAddress) return;
    
    try {
      const balance = await getUserTokenBalance(
        walletAddress,
        connection
      );
      setUserBalance(balance);
    } catch (error) {
      console.error('Error fetching user balance:', error);
    }
  };

  // Load data on mount and when wallet changes
  useEffect(() => {
    fetchEscrowState();
    fetchAvailableTokens();
  }, []);

  useEffect(() => {
    if (walletAddress) {
      fetchUserBalance();
    }
  }, [walletAddress]);

  // Buy tokens
  const buyTokens = async (amount: number): Promise<{ success: boolean; signature?: string; error?: string }> => {
    console.log('🛒 buyTokens called with amount:', amount);
    console.log('  walletAddress:', walletAddress);
    console.log('  solanaWallet:', solanaWallet);
    
    if (!walletAddress) {
      console.error('❌ No wallet address');
      return {
        success: false,
        error: 'Wallet not connected. Please connect your Solana wallet.',
      };
    }

    if (!solanaWallet) {
      console.error('❌ No solana wallet object');
      console.error('   This usually means the wallet needs to be reconnected');
      console.error('   Try disconnecting and reconnecting your wallet');
      return {
        success: false,
        error: 'Solana wallet not ready. Please disconnect and reconnect your wallet, then try again.',
      };
    }

    setLoading(true);

    try {
      console.log('📤 Calling buyTokensFromEscrow...');
      const result = await buyTokensFromEscrow(
        walletAddress,
        amount,
        async (tx: Transaction) => {
          console.log('✍️  Signing and sending transaction with Privy wallet...');
          
          // Serialize the transaction first (like Gateway does)
          const serializedTx = tx.serialize({
            requireAllSignatures: false,
            verifySignatures: false,
          });
          
          console.log('📦 Transaction serialized, length:', serializedTx.length);
          
          // Use Privy's signAndSendTransaction (like NFT minting does)
          const signResult = await solanaWallet.signAndSendTransaction({
            transaction: serializedTx,
            chain: `solana:devnet`,
          });
          
          console.log('✅ Transaction sent, raw signature:', signResult.signature);
          console.log('   Signature type:', typeof signResult.signature);
          
          // Convert signature to base58 string if it's a Uint8Array
          let signature: string;
          if (signResult.signature instanceof Uint8Array) {
            signature = bs58.encode(signResult.signature);
            console.log('   Converted to base58:', signature);
          } else {
            signature = signResult.signature;
          }
          
          // Wait for confirmation
          console.log('⏳ Confirming transaction...');
          await connection.confirmTransaction(signature, 'confirmed');
          console.log('✅ Transaction confirmed');
          
          return signature;
        },
        connection
      );

      if (result.success) {
        console.log('✅ Purchase successful, refreshing balances...');
        // Refresh balances
        await Promise.all([
          fetchAvailableTokens(),
          fetchUserBalance(),
          fetchEscrowState(),
        ]);
      }

      return result;
    } catch (error: any) {
      console.error('❌ Buy tokens error:', error);
      return {
        success: false,
        error: error.message || 'Failed to purchase tokens',
      };
    } finally {
      setLoading(false);
    }
  };

  // Calculate cost for amount
  const getCost = async (amount: number) => {
    try {
      return await calculatePurchaseCost(amount, connection);
    } catch (error) {
      return { costInLamports: 0, costInSOL: 0 };
    }
  };

  return {
    // State
    loading,
    escrowState,
    availableTokens,
    userBalance,
    pricePerToken: escrowState?.pricePerToken || 0,
    
    // Functions
    buyTokens,
    getCost,
    refresh: async () => {
      await Promise.all([
        fetchEscrowState(),
        fetchAvailableTokens(),
        fetchUserBalance(),
      ]);
    },
    
    // Utilities
    tokensToSmallestUnit,
    smallestUnitToTokens,
  };
}
