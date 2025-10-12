import { useState } from 'react';
import { useAuth } from './useAuth';

export function useWalletRequired() {
  const { walletAddress, isAuthenticated } = useAuth();
  const [showModal, setShowModal] = useState(false);

  /**
   * Check if wallet is required and show modal if not connected
   * Returns true if wallet is connected, false otherwise
   */
  const requireWallet = (customMessage?: { title?: string; description?: string }) => {
    if (!isAuthenticated) {
      // User not logged in at all
      return false;
    }

    if (!walletAddress) {
      // User logged in but no wallet linked
      setShowModal(true);
      return false;
    }

    // Wallet is connected
    return true;
  };

  const closeModal = () => setShowModal(false);

  return {
    requireWallet,
    showModal,
    closeModal,
    hasWallet: !!walletAddress,
  };
}
