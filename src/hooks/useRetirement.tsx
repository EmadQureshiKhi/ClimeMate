'use client';

import { useState } from 'react';
import { useWallets } from '@privy-io/react-auth/solana';
import { Connection } from '@solana/web3.js';
import bs58 from 'bs58';
import { useAuth } from './useAuth';
import { retireCO2eTokens, calculateRetirementStatus } from '@/lib/co2e-retirement';
import { useToast } from './use-toast';

export function useRetirement() {
  const { walletAddress } = useAuth();
  const { wallets } = useWallets();
  const { toast } = useToast();
  const [isRetiring, setIsRetiring] = useState(false);

  // Create connection
  const connection = new Connection(
    process.env.NEXT_PUBLIC_SOLANA_RPC || 'https://api.devnet.solana.com',
    'confirmed'
  );

  const retireCredits = async (
    certificateId: string,
    amount: number,
    totalEmissions: number
  ): Promise<{ success: boolean; signature?: string; error?: string }> => {
    if (!walletAddress || !connection) {
      return {
        success: false,
        error: 'Wallet not connected',
      };
    }

    setIsRetiring(true);

    try {
      const wallet = wallets[0];
      if (!wallet) {
        throw new Error('No wallet found');
      }

      // Sign and send transaction (matches escrow pattern)
      const signAndSendTransaction = async (tx: any) => {
        try {
          console.log('✍️  Signing and sending retirement transaction with Privy wallet...');
          
          // Serialize the transaction first (like Gateway does)
          const serializedTx = tx.serialize({
            requireAllSignatures: false,
            verifySignatures: false,
          });
          
          console.log('📦 Transaction serialized, length:', serializedTx.length);
          
          // Use Privy's signAndSendTransaction (like escrow does)
          const signResult = await wallet.signAndSendTransaction({
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
          
          return signature;
        } catch (error: any) {
          console.error('❌ Transaction error:', error);
          throw error;
        }
      };

      // Retire tokens (burn them)
      const result = await retireCO2eTokens(
        walletAddress,
        certificateId,
        amount,
        totalEmissions,
        signAndSendTransaction,
        connection
      );

      if (!result.success) {
        throw new Error(result.error || 'Failed to retire credits');
      }

      // Update certificate in database
      try {
        const updateResponse = await fetch(`/api/certificates/${certificateId}/retire`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount,
            transactionSignature: result.signature,
            walletAddress,
          }),
        });

        if (!updateResponse.ok) {
          const errorData = await updateResponse.json();
          console.error('Failed to update certificate:', errorData);
          throw new Error('Failed to update certificate in database');
        }

        const updateData = await updateResponse.json();
        console.log('✅ Certificate updated:', updateData);

        // Check if NFT was minted (fully offset)
        if (updateData.nftMinted) {
          toast({
            title: '🎉 Certificate Fully Offset!',
            description: (
              <div className="space-y-1">
                <p>Retired {amount} CO₂e credits successfully! NFT minted for fully offset certificate.</p>
                <a 
                  href={`https://solscan.io/tx/${result.signature}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs underline"
                >
                  View on Solscan
                </a>
              </div>
            ),
          });
        } else {
          const percentage = updateData.certificate?.offsetPercentage || 0;
          toast({
            title: '✅ Credits Retired Successfully!',
            description: (
              <div className="space-y-1">
                <p>Retired {amount} CO₂e credits. {typeof percentage === 'number' ? percentage.toFixed(1) : percentage}% of emissions offset.</p>
                <a 
                  href={`https://solscan.io/tx/${result.signature}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs underline"
                >
                  View on Solscan
                </a>
              </div>
            ),
          });
        }
      } catch (dbError) {
        console.error('Database update error:', dbError);
        // Don't fail the whole operation if DB update fails
        toast({
          title: '⚠️ Credits Retired (DB Update Failed)',
          description: 'Tokens were burned but database update failed. Contact support.',
          variant: 'destructive',
        });
      }

      return {
        success: true,
        signature: result.signature,
      };
    } catch (error: any) {
      console.error('Retirement error:', error);
      toast({
        title: 'Retirement Failed',
        description: error.message || 'Failed to retire credits',
        variant: 'destructive',
      });

      return {
        success: false,
        error: error.message,
      };
    } finally {
      setIsRetiring(false);
    }
  };

  return {
    retireCredits,
    isRetiring,
    calculateRetirementStatus,
  };
}
