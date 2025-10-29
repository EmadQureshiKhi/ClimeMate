import { useState } from 'react';
import { Connection } from '@solana/web3.js';
import { useAuth } from '@/hooks/useAuth';
import bs58 from 'bs58';
import { signAndSendMemo } from '@/lib/memo-transaction';

const SOLANA_RPC = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com';
const SOLANA_NETWORK = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet';

export function useChargingClaim() {
  const { walletAddress, solanaWallet } = useAuth();
  const [loading, setLoading] = useState(false);

  const connection = new Connection(SOLANA_RPC, 'confirmed');

  /**
   * Claim rewards with two-step process:
   * 1. User signs memo transaction (audit trail)
   * 2. Backend transfers tokens from reward pool
   */
  const claimRewards = async (
    sessionId: string,
    tokensEarned: number,
    sessionData: {
      stationId: string;
      energyKwh: number;
      co2eSaved: number;
    }
  ): Promise<{ success: boolean; signature?: string; error?: string }> => {
    if (!walletAddress || !solanaWallet) {
      return {
        success: false,
        error: 'Wallet not connected',
      };
    }

    setLoading(true);

    try {
      console.log('🔋 Step 1: User signs memo transaction...');
      
      // Step 1: Create and sign memo transaction
      const memoData = {
        type: 'CHARGING_REWARD_CLAIM',
        action: 'CLAIM_CO2E_TOKENS',
        module: 'EV Charging',
        sessionId,
        stationId: sessionData.stationId,
        energyKwh: sessionData.energyKwh,
        co2eSaved: sessionData.co2eSaved,
        tokensEarned,
        user: walletAddress,
        timestamp: new Date().toISOString(),
      };

      const memoResult = await signAndSendMemo(
        memoData,
        walletAddress,
        async (tx) => {
          const serializedTx = tx.serialize({
            requireAllSignatures: false,
            verifySignatures: false,
          });
          
          const signResult = await solanaWallet.signAndSendTransaction({
            transaction: serializedTx,
            chain: `solana:${SOLANA_NETWORK}`,
          });
          
          // Convert signature
          let signature: string;
          if (signResult.signature instanceof Uint8Array) {
            signature = bs58.encode(signResult.signature);
          } else {
            signature = signResult.signature;
          }
          
          await connection.confirmTransaction(signature, 'confirmed');
          return signature;
        },
        connection
      );

      if (!memoResult.success || !memoResult.signature) {
        throw new Error(memoResult.error || 'Failed to sign memo transaction');
      }

      console.log('✅ Step 1 complete: Memo signed');
      console.log(`   Signature: ${memoResult.signature}`);

      // Step 2: Backend transfers tokens
      console.log('💰 Step 2: Backend transferring tokens...');
      
      const response = await fetch('/api/charging/mint-credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          userWallet: walletAddress,
          amount: tokensEarned,
          co2eSaved: sessionData.co2eSaved,
          energyUsed: sessionData.energyKwh,
          stationId: sessionData.stationId,
          memoSignature: memoResult.signature, // Pass memo signature
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to transfer tokens');
      }

      const result = await response.json();
      console.log('✅ Step 2 complete: Tokens transferred');
      console.log(`   Transfer signature: ${result.signature}`);

      // Log to audit logs
      try {
        await fetch('/api/audit-logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            module: 'EV Charging',
            action: 'claim_charging_rewards',
            transactionSignature: memoResult.signature,
            dataHash: `session_${sessionId}`,
            details: {
              sessionId,
              stationId: sessionData.stationId,
              energyKwh: sessionData.energyKwh,
              co2eSaved: sessionData.co2eSaved,
              tokensEarned,
              memoSignature: memoResult.signature,
              transferSignature: result.signature,
            },
            userWalletAddress: walletAddress,
            status: 'success',
          }),
        });
      } catch (auditError) {
        console.warn('⚠️  Failed to log to audit (non-critical):', auditError);
      }

      return {
        success: true,
        signature: memoResult.signature, // Return memo signature for Solscan link
        virtualWorldRewards: result.virtualWorldRewards, // Pass through virtual world rewards
      };
    } catch (error: any) {
      console.error('❌ Claim failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to claim rewards',
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    claimRewards,
    loading,
  };
}
