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
  isPrivate?: boolean; // NEW: Privacy mode flag
  encryptedDataId?: string; // NEW: Arcium reference
  arciumSignature?: string; // NEW: Arcium transaction
}

export async function logToBlockchainWithDB({
  wallets,
  activeClient,
  module,
  action,
  data,
  setBlockchainLogs,
  setIsLoggingToBlockchain,
  isPrivate = false, // NEW: Default to public mode
  encryptedDataId,
  arciumSignature,
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
    // If private mode, mask sensitive data
    const logData = isPrivate ? {
      type: 'PRIVATE_SEMA_AUDIT_LOG',
      version: '1.0',
      application: 'ClimeMate SEMA Tools',
      module,
      action: action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      isPrivate: true,
      encryptedDataId,
      arciumSignature,
      details: {
        clientId: activeClient.id,
        clientName: activeClient.name,
        // Only include non-sensitive summary data
        ...Object.keys(data).reduce((acc, key) => {
          // Include only summary fields, not detailed data
          if (['totalStakeholders', 'totalMaterialTopics', 'complianceScore'].includes(key)) {
            acc[key] = data[key];
          } else {
            acc[key] = 'ENCRYPTED';
          }
          return acc;
        }, {} as any),
      },
      timestamp: new Date().toISOString(),
      user: wallet.address,
    } : {
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


/**
 * Log certificate creation to blockchain (handles both public and private modes)
 */
export async function logCertificateToBlockchain(
  walletAddress: string,
  certificateData: {
    id: string;
    organizationName: string;
    totalEmissions: number;
    scope1Emissions?: number | null;
    scope2Emissions?: number | null;
    scope3Emissions?: number | null;
    isPrivate?: boolean;
    encryptedDataId?: string;
    arciumSignature?: string;
  },
  signAndSendTransaction: (tx: any) => Promise<string>
): Promise<{ success: boolean; signature?: string; error?: string }> {
  try {
    // Determine if private mode
    const isPrivate = certificateData.isPrivate || false;
    
    // Create log data based on mode
    const logData = isPrivate ? {
      type: 'PRIVATE_CERTIFICATE_CREATED',
      version: '1.0',
      application: 'ClimeMate',
      module: 'Certificate Generation',
      certificateId: certificateData.id,
      organizationName: certificateData.organizationName,
      totalEmissions: certificateData.totalEmissions, // ✅ Public (for verification)
      isPrivate: true,
      encryptedDataId: certificateData.encryptedDataId,
      arciumSignature: certificateData.arciumSignature,
      dataHash: CryptoJS.SHA256(JSON.stringify({
        scope1: certificateData.scope1Emissions,
        scope2: certificateData.scope2Emissions,
        scope3: certificateData.scope3Emissions,
      })).toString(),
      scopeBreakdown: 'ENCRYPTED', // 🔒 Not revealed
      timestamp: new Date().toISOString(),
      user: walletAddress,
    } : {
      type: 'CERTIFICATE_CREATED',
      version: '1.0',
      application: 'ClimeMate',
      module: 'Certificate Generation',
      certificateId: certificateData.id,
      organizationName: certificateData.organizationName,
      totalEmissions: certificateData.totalEmissions,
      scope1Emissions: certificateData.scope1Emissions, // ✅ Logged
      scope2Emissions: certificateData.scope2Emissions, // ✅ Logged
      scope3Emissions: certificateData.scope3Emissions, // ✅ Logged
      timestamp: new Date().toISOString(),
      user: walletAddress,
    };
    
    // Log to Solana
    const result = await logCertificateOnChain(
      walletAddress,
      logData,
      signAndSendTransaction
    );
    
    return result;
  } catch (error: any) {
    console.error('Failed to log certificate to blockchain:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Generate data hash for integrity verification
 */
export function generateDataHash(data: any): string {
  return CryptoJS.SHA256(JSON.stringify(data)).toString();
}
