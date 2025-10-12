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
          // Show all Solana wallets - detected wallets will appear first
          walletList: [
            'detected_solana_wallets', // Auto-detect installed Solana wallets
            'phantom',
            'solflare',
            'backpack',
            'glow',
            'slope',
            'sollet',
            'coin98',
            'trust',
            'exodus',
            'brave',
          ],
          walletChainType: 'solana-only', // Only show Solana wallets
        },
        
        // Login methods
        loginMethods: ['email', 'wallet', 'google'],
        
        // Embedded wallets - DISABLED
        embeddedWallets: {
          createOnLogin: 'off',
          noPromptOnSignature: false,
        },
        
        // External wallets - Solana connectors (REQUIRED!)
        externalWallets: {
          solana: {
            connectors: toSolanaWalletConnectors(),
          },
        },
        
        // Solana-specific configuration
        solanaClusters: [
          {
            name: 'mainnet-beta',
            rpcUrl: 'https://api.mainnet-beta.solana.com',
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
