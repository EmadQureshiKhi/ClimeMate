import { usePrivy } from '@privy-io/react-auth';
import { useWallets as useSolanaWallets } from '@privy-io/react-auth/solana';

export function useAuth() {
  const {
    ready,
    authenticated,
    user,
    login,
    logout,
    linkEmail,
    linkWallet,
    linkGoogle,
  } = usePrivy();

  // Get Solana wallets using the Solana-specific hook
  // NOTE: This detects browser wallets but we should NOT use them unless linked
  const { wallets: solanaWallets } = useSolanaWallets();
  const primarySolanaWallet = solanaWallets[0]; // First Solana wallet
  
  // Debug: Log detected vs linked wallets
  if (solanaWallets.length > 0) {
    console.log('🔍 Detected Solana wallets:', solanaWallets.length);
  }

  // Get wallet address - ONLY from linked accounts, not from detected wallets
  const getWalletAddress = () => {
    // Wait for user object to be ready
    if (!ready || !user) {
      return undefined;
    }

    // Debug: Log all linked accounts
    if (user.linkedAccounts && user.linkedAccounts.length > 0) {
      console.log('🔍 Linked accounts:', user.linkedAccounts.map((acc: any) => ({
        type: acc.type,
        chainType: acc.chainType,
        address: acc.address ? acc.address.slice(0, 8) + '...' : 'none',
      })));
    }

    // ONLY check user's linked accounts for wallet
    // Do NOT use connected wallets unless they're linked to the account
    const walletAccounts = user.linkedAccounts?.filter((account: any) => account.type === 'wallet') || [];
    
    if (walletAccounts.length === 0) {
      console.log('❌ No linked wallet found');
      return undefined;
    }

    // Find Solana wallet first
    const solanaAccount = walletAccounts.find(
      (account: any) => account.chainType === 'solana'
    );
    
    if (solanaAccount) {
      console.log('✅ Found linked Solana wallet:', (solanaAccount as any).address?.slice(0, 8) + '...');
      return (solanaAccount as any).address;
    }
    
    // Fallback: any wallet address
    const anyWallet = walletAccounts[0];
    if (anyWallet && anyWallet.address) {
      console.log('✅ Found linked wallet (non-Solana):', anyWallet.address.slice(0, 8) + '...');
      return anyWallet.address;
    }
    
    console.log('❌ No wallet address found in linked accounts');
    return undefined;
  };

  // Get display name for Google users
  const getDisplayName = () => {
    if (user?.google?.name) {
      return user.google.name;
    }
    if (user?.email?.address) {
      return user.email.address.split('@')[0];
    }
    return undefined;
  };

  return {
    // Auth state
    isReady: ready,
    isAuthenticated: authenticated,
    user,
    
    // User info
    userId: user?.id,
    email: user?.email?.address,
    walletAddress: getWalletAddress(),
    displayName: getDisplayName(),
    
    // Auth methods
    login,
    logout,
    
    // Link additional accounts
    linkEmail,
    linkWallet,
    linkGoogle,
    
    // Wallet info
    wallets: solanaWallets,
    solanaWallets,
    solanaWallet: primarySolanaWallet,
  };
}
