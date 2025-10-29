import { useState } from 'react';
import { Connection } from '@solana/web3.js';
import { useAuth } from '@/hooks/useAuth';
import bs58 from 'bs58';
import { claimChargingRewards, calculateClaimableRewards } from '@/lib/charging-rewards';
import { sendTransactionWithGateway } from '@/lib/sanctum-gateway';

const SOLANA_RPC = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com';
const SOLANA_NETWORK = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet';

export function useChargingRewards() {
  const { walletAddress, solanaWallet } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connection = new Connection(SOLANA_RPC, 'confirmed');

  /**
   * Claim rewards for a charging session
   */
  const claimRewards = async (
    sessionId: string,
    tokensEarned: number,
    sessionData: {
      stationId: string;
      energyKwh: number;
      co2eSaved: number;
      startTime: string;
      endTime: string;
    }
  ): Promise<{ success: boolean; signature?: string; error?: string }> => {
    console.log('🔋 claimRewards called');
    console.log('  sessionId:', sessionId);
    console.log('  tokensEarned:', tokensEarned);
    console.log('  walletAddress:', walletAddress);
    console.log('  solanaWallet:', solanaWallet);

    if (!walletAddress) {
      const errorMsg = 'Wallet not connected. Please connect your Solana wallet.';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }

    if (!solanaWallet) {
      const errorMsg = 'Solana wallet not ready. Please disconnect and reconnect your wallet.';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }

    setLoading(true);
    setError(null);

    try {
      console.log('📤 Calling claimChargingRewards...');
      
      const result = await claimChargingRewards(
        sessionId,
        tokensEarned,
        walletAddress,
        sessionData,
        async (tx) => {
          console.log('✍️  Signing and sending transaction with Privy wallet...');
          
          // Serialize the transaction
          const serializedTx = tx.serialize({
            requireAllSignatures: false,
            verifySignatures: false,
          });
          
          console.log('📦 Transaction serialized, length:', serializedTx.length);
          
          // Use Privy's signAndSendTransaction
          const signResult = await solanaWallet.signAndSendTransaction({
            transaction: serializedTx,
            chain: `solana:${SOLANA_NETWORK}`,
          });
          
          console.log('✅ Transaction sent, raw signature:', signResult.signature);
          
          // Convert signature to base58 string if needed
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

      if (result.success && result.signature) {
        console.log('✅ Claim successful, logging to audit...');
        
        // Log to audit logs
        try {
          await fetch('/api/audit-logs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              module: 'EV Charging',
              action: 'claim_charging_rewards',
              transactionSignature: result.signature,
              dataHash: `session_${sessionId}`,
              details: {
                sessionId,
                stationId: sessionData.stationId,
                energyKwh: sessionData.energyKwh,
                co2eSaved: sessionData.co2eSaved,
                tokensEarned,
                startTime: sessionData.startTime,
                endTime: sessionData.endTime,
              },
              userWalletAddress: walletAddress,
              status: 'success',
            }),
          });
          console.log('✅ Logged to audit logs');
        } catch (auditError) {
          console.warn('⚠️  Failed to log to audit (non-critical):', auditError);
        }

        // Update session in database
        try {
          await fetch('/api/charging/mint-credits', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId,
              transactionSignature: result.signature,
            }),
          });
          console.log('✅ Updated session in database');
        } catch (dbError) {
          console.warn('⚠️  Failed to update database (non-critical):', dbError);
        }
      }

      return result;
    } catch (err: any) {
      console.error('❌ Claim rewards error:', err);
      const errorMsg = err.message || 'Failed to claim rewards';
      setError(errorMsg);
      return {
        success: false,
        error: errorMsg,
      };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Calculate total claimable rewards from sessions
   */
  const getClaimableRewards = async (sessions: any[]) => {
    try {
      return await calculateClaimableRewards(sessions);
    } catch (err) {
      console.error('Error calculating claimable rewards:', err);
      return {
        totalSessions: 0,
        totalEnergy: 0,
        totalCO2eSaved: 0,
        totalTokens: 0,
        claimableSessions: [],
      };
    }
  };

  return {
    claimRewards,
    getClaimableRewards,
    loading,
    error,
  };
}
