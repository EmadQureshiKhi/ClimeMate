'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { toSolanaWalletConnectors } from '@privy-io/react-auth/solana';
import { useRouter } from 'next/navigation';

export function PrivyAuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ''}
      config={{
        // Customize Privy's appearance
        appearance: {
          theme: 'light',
          accentColor: '#16a34a', // Green color matching your brand
          logo: 'https://i.ibb.co/dwzM2KLM/Untitled-design-removebg-preview.png',
          // Show Solana wallets
          walletList: [
            'detected_solana_wallets', // Auto-detect installed Solana wallets
            'phantom',
            'solflare',
            'backpack',
          ],
          walletChainType: 'solana-only', // Only show Solana wallets
        },
        
        // Login methods
        loginMethods: ['email', 'wallet', 'google'],
        
        // Embedded wallets configuration
        embeddedWallets: {
          solana: {
            createOnLogin: 'off',
          },
        },
        
        // External wallets - Solana connectors (REQUIRED!)
        externalWallets: {
          solana: {
            connectors: toSolanaWalletConnectors({
              shouldAutoConnect: true,
            }),
          },
        },
        
        // Solana-specific configuration
        solanaClusters: [
          {
            name: process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet',
            rpcUrl: process.env.NEXT_PUBLIC_SOLANA_RPC || 'https://api.devnet.solana.com',
          },
        ],
      }}
      onSuccess={() => {
        // Redirect to dashboard after successful login
        router.push('/');
      }}
    >
      {children}
    </PrivyProvider>
  );
}
