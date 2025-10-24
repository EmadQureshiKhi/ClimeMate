import { logCertificateOnChain } from './solana-nft';
import CryptoJS from 'crypto-js';

interface BlockchainLogParams {
  wallets: any[];
  activeClient: any;
  module: string;
  action: string;
  data: any;
  setBlockchainLogs: (updater: (prev: any[]) => any[]) => void;
  setIsLoggingToBlockchain: (loading: boolean) => void;
}

export async function logToBlockchainWithDB({
  wallets,
  activeClient,
  module,
  action,
  data,
  setBlockchainLogs,
  setIsLoggingToBlockchain,
}: BlockchainLogParams): Promise<void> {
  if (!wallets || wallets.length === 0 || !activeClient) {
    console.warn('No wallet connected or no active client, skipping blockchain log');
    return;
  }

  // Don't log for demo clients
  if (activeClient.status === 'demo') {
    return;
  }

  setIsLoggingToBlockchain(true);

  try {
    const wallet = wallets[0];
    
    // Create detailed audit log data
    const logData = {
      type: 'SEMA_AUDIT_LOG',
      version: '1.0',
      application: 'ClimeMate SEMA Tools',
      module,
      action: action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      details: {
        clientId: activeClient.id,
        clientName: activeClient.name,
        ...data,
      },
      timestamp: new Date().toISOString(),
      user: wallet.address,
    };
    
    const dataHash = CryptoJS.SHA256(JSON.stringify(logData)).toString();

    // Add pending log to UI
    const pendingLog = {
      transactionSignature: '',
      action,
      dataHash,
      timestamp: new Date().toISOString(),
      status: 'pending' as const,
    };
    
    setBlockchainLogs(prev => [pendingLog, ...prev]);

    // Log to Solana
    const logResult = await logCertificateOnChain(
      wallet.address,
      logData,
      async (txData: any) => {
        const result = await wallet.signAndSendTransaction(txData);
        return result;
      }
    );

    if (logResult.success) {
      // Update UI
      setBlockchainLogs(prev => 
        prev.map((log, index) => 
          index === 0 
            ? { ...log, transactionSignature: logResult.signature, status: 'success' as const }
            : log
        )
      );

      // Save to database
      try {
        await fetch('/api/sema/blockchain-logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientId: activeClient.id,
            module,
            action,
            transactionSignature: logResult.signature,
            dataHash,
            details: logData,
            userWalletAddress: wallet.address,
            status: 'success',
          }),
        });
      } catch (dbError) {
        console.error('Failed to save log to database:', dbError);
        // Don't fail the whole operation if DB save fails
      }
    } else {
      setBlockchainLogs(prev => 
        prev.map((log, index) => 
          index === 0 
            ? { ...log, status: 'error' as const, error: logResult.error || 'Failed to log' }
            : log
        )
      );

      // Save error to database
      try {
        await fetch('/api/sema/blockchain-logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientId: activeClient.id,
            module,
            action,
            transactionSignature: '',
            dataHash,
            details: logData,
            userWalletAddress: wallet.address,
            status: 'error',
            error: logResult.error || 'Failed to log',
          }),
        });
      } catch (dbError) {
        console.error('Failed to save error log to database:', dbError);
      }
    }
  } catch (error: any) {
    console.error('Failed to log to blockchain:', error);
    setBlockchainLogs(prev => 
      prev.map((log, index) => 
        index === 0 
          ? { ...log, status: 'error' as const, error: error.message || 'Unknown error' }
          : log
      )
    );
  } finally {
    setIsLoggingToBlockchain(false);
  }
}
