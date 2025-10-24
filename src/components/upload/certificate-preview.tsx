'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';
import { useWallets } from '@privy-io/react-auth/solana';
import { 
  Award, 
  Download, 
  Share2, 
  CheckCircle,
  ArrowLeft,
  Loader2,
  ExternalLink,
  Copy
} from 'lucide-react';
import { format } from 'date-fns';
import CryptoJS from 'crypto-js';
import { mintCertificateNFT, logCertificateOnChain, getExplorerUrl, getNFTExplorerUrl, type CertificateMetadata } from '@/lib/solana-nft';
import { NotificationToast } from './notification-toast';

interface CertificatePreviewProps {
  calculations: any;
  emissionDataId?: string;
  onGenerate: (certificate: any) => void;
  onPrevious: () => void;
}

export function CertificatePreview({ calculations, emissionDataId, onGenerate, onPrevious }: CertificatePreviewProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [certificate, setCertificate] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const { userId, walletAddress } = useAuth();
  const { wallets } = useWallets();
  
  // Notification state
  const [notification, setNotification] = useState<{
    isVisible: boolean;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
  }>({
    isVisible: false,
    type: 'info',
    title: '',
    message: '',
  });

  const showNotification = (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => {
    setNotification({
      isVisible: true,
      type,
      title,
      message,
    });
  };
  
  // Check if we have a valid emission data ID
  const hasValidEmissionDataId = emissionDataId && emissionDataId !== 'temp-emission-id' && emissionDataId.length > 10;
  

  const generateCertificate = async () => {
    // Validation checks with user-friendly messages
    if (!userId) {
      showNotification('error', 'Login Required', 'Please login to generate certificate');
      return;
    }

    if (!walletAddress) {
      showNotification('warning', 'No Wallet Linked', 'Please link a Solana wallet in Settings to mint NFT certificates.');
      return;
    }

    // Check if user has a connected wallet in browser
    if (!wallets || wallets.length === 0) {
      showNotification('warning', 'No Wallet Detected', 'Please connect a Solana wallet (Phantom, Solflare, etc.) to your browser.');
      return;
    }

    setIsGenerating(true);

    try {
      // 1. Generate certificate data
      const certificateId = `GHG-${Date.now()}`;
      const title = `Emissions Certificate - ${format(new Date(), 'MMM yyyy')}`;
      const breakdown = calculations.breakdown || calculations.categoryBreakdown;
      
      // Generate data hash
      const hashData = {
        totalEmissions: calculations.totalEmissions,
        breakdown,
        summary: calculations.summary || {},
        processedData: calculations.processedData || [],
        timestamp: new Date().toISOString()
      };
      const dataHash = CryptoJS.SHA256(JSON.stringify(hashData)).toString();

      console.log('🎨 Minting NFT certificate...');

      // 2. Get active wallet and validate
      const wallet = wallets[0];
      if (!wallet) {
        throw new Error('No wallet connected');
      }

      const activeWalletAddress = wallet.address;
      console.log('🔑 Active wallet:', activeWalletAddress);
      console.log('🔑 Linked wallet:', walletAddress);

      // IMPORTANT: Check if the active wallet matches the linked wallet
      if (activeWalletAddress.toLowerCase() !== walletAddress.toLowerCase()) {
        showNotification(
          'warning',
          'Wallet Mismatch Detected',
          `Your browser wallet: ${activeWalletAddress.slice(0, 8)}...${activeWalletAddress.slice(-6)}\n` +
          `Your linked wallet: ${walletAddress.slice(0, 8)}...${walletAddress.slice(-6)}\n\n` +
          'Please switch to the wallet linked to your account, or link your current wallet in Settings.'
        );
        setIsGenerating(false);
        return;
      }

      console.log('✅ Wallet verification passed');

      const certificateMetadata: CertificateMetadata = {
        certificateId,
        title,
        totalEmissions: calculations.totalEmissions,
        breakdown,
        issueDate: new Date().toISOString(),
      };

      // IMPORTANT: Save certificate to database FIRST so metadata endpoint works immediately
      console.log('💾 Pre-saving certificate to database...');
      const preSaveResponse = await fetch('/api/certificates/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          emissionDataId,
          certificateId,
          title,
          totalEmissions: calculations.totalEmissions,
          breakdown,
          processedData: calculations.processedData || [],
          summary: calculations.summary || {},
          dataHash,
          blockchainTx: null, // Will update after minting
          nftAddress: null,
          metadataUri: null,
          logTransactionSignature: null,
        }),
      });

      if (!preSaveResponse.ok) {
        throw new Error('Failed to pre-save certificate to database');
      }

      const { certificate: preSavedCertificate } = await preSaveResponse.json();
      console.log('✅ Certificate pre-saved to database:', preSavedCertificate.id);

      // Mint compressed NFT via backend
      console.log('🎨 Minting compressed NFT via backend...');
      const nftResponse = await fetch('/api/nft/mint-compressed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          certificateData: certificateMetadata,
          userWallet: activeWalletAddress,
          userId,
        }),
      });

      const nftResult = await nftResponse.json();

      if (!nftResponse.ok || !nftResult.success) {
        throw new Error(nftResult.error || nftResult.details || 'Failed to mint NFT');
      }

      console.log('✅ Compressed NFT minted successfully:', nftResult);

      // 3. Log certificate creation on-chain
      console.log('📝 Logging certificate on blockchain...');
      const logResult = await logCertificateOnChain(
        activeWalletAddress,
        {
          type: 'CERTIFICATE_AUDIT_LOG',
          version: '1.0',
          application: 'ClimeMate Carbon Certificate',
          module: 'Certificate Generation',
          action: 'Certificate Created',
          details: {
            certificateId,
            dataHash,
            totalEmissions: calculations.totalEmissions,
            breakdown,
            organizationName: calculations.organizationName,
          },
          timestamp: new Date().toISOString(),
          user: activeWalletAddress,
        },
        async (txData: any) => {
          const result = await wallet.signAndSendTransaction(txData);
          return result;
        }
      );

      if (!logResult.success) {
        console.warn('⚠️ Failed to log certificate on-chain:', logResult.error);
        // Don't fail the whole process, just warn
      } else {
        console.log('✅ Certificate logged on-chain:', logResult.signature);
      }

      // 4. Update certificate with blockchain data
      console.log('🔄 Updating certificate with blockchain data...');
      const updateResponse = await fetch(`/api/certificates/${preSavedCertificate.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          blockchainTx: nftResult.transactionSignature,
          nftAddress: nftResult.nftAddress,
          metadataUri: nftResult.metadataUri,
          logTransactionSignature: logResult.success ? logResult.signature : undefined,
        }),
      });

      let savedCertificate = preSavedCertificate;
      if (updateResponse.ok) {
        const { certificate: updatedCertificate } = await updateResponse.json();
        savedCertificate = updatedCertificate;
        console.log('✅ Certificate updated with blockchain data');
      } else {
        console.warn('⚠️ Failed to update certificate, using pre-saved version');
      }

      // 5. Set certificate state
      const result = {
        ...savedCertificate,
        nftAddress: nftResult.nftAddress,
        transactionSignature: nftResult.transactionSignature,
        metadataUri: nftResult.metadataUri,
      };

      setCertificate(result);
      onGenerate(result);
    } catch (error: any) {
      console.error('❌ Failed to create certificate:', error);
      
      // User-friendly error messages
      let title = 'Certificate Generation Failed';
      let message = 'Failed to create certificate';
      
      if (error.message?.includes('User rejected')) {
        title = 'Transaction Cancelled';
        message = 'You rejected the transaction in your wallet.';
      } else if (error.message?.includes('Insufficient funds')) {
        title = 'Insufficient Funds';
        message = 'You don\'t have enough SOL to pay for the transaction fee.\n\nPlease add some SOL to your wallet.';
      } else if (error.message?.includes('not required to sign')) {
        title = 'Wallet Mismatch';
        message = 'The connected wallet doesn\'t match your linked wallet.\n\nPlease switch wallets or link your current wallet in Settings.';
      } else if (error.message?.includes('Network')) {
        title = 'Network Error';
        message = 'Couldn\'t connect to Solana network.\n\nPlease check your internet connection and try again.';
      } else if (error.message?.includes('timeout')) {
        title = 'Transaction Timeout';
        message = 'The transaction took too long.\n\nPlease try again.';
      } else {
        title = 'Error';
        message = `${error.message || 'Unknown error'}\n\nPlease try again or contact support if the issue persists.`;
      }
      
      showNotification('error', title, message);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadPDF = () => {
    // Mock PDF download
    const element = document.createElement('a');
    const file = new Blob(['Certificate PDF content would be here'], { type: 'application/pdf' });
    element.href = URL.createObjectURL(file);
    element.download = `GHG-Certificate-${certificate?.certificate_id}.pdf`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-6">
      {/* Certificate Preview */}
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950"></div>
        <CardHeader className="relative">
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Award className="h-6 w-6 text-green-600" />
            GHG Emissions Certificate
          </CardTitle>
          <CardDescription>
            Blockchain-verified carbon footprint certificate
          </CardDescription>
        </CardHeader>
        <CardContent className="relative space-y-6">
          {/* Certificate Content */}
          <div className="bg-white dark:bg-gray-900 p-8 rounded-lg border-2 border-green-200 dark:border-green-800 shadow-lg">
            <div className="text-center space-y-4 mb-8">
              <div className="w-16 h-16 mx-auto bg-green-600 rounded-full flex items-center justify-center">
                <Award className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-green-600">
                Carbon Emissions Certificate
              </h2>
              <p className="text-muted-foreground">
                This certificate verifies the carbon footprint calculation
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Total Emissions</label>
                  <p className="text-2xl font-bold text-primary">
                    {calculations.totalEmissions.toLocaleString()} kg CO₂e
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Issue Date</label>
                  <p className="font-medium">{format(new Date(), 'PPP')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Valid Until</label>
                  <p className="font-medium">{format(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), 'PPP')}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Categories</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {Object.keys(calculations.breakdown || calculations.categoryBreakdown || {}).map((category) => (
                      <Badge key={category} variant="secondary">
                        {category}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Data Points</label>
                  <p className="font-medium">{calculations.summary?.processedRows || 0} entries</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                </div>
              </div>
            </div>

          </div>

          {/* Generation Button */}
          {!certificate && (
            <div className="text-center">
              <Button
                size="lg"
                onClick={generateCertificate}
                disabled={isGenerating || !walletAddress}
                className="bg-green-600 hover:bg-green-700"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Minting NFT Certificate...
                  </>
                ) : (
                  <>
                    <Award className="h-5 w-5 mr-2" />
                    Generate Certificate
                  </>
                )}
              </Button>
              <p className="text-sm text-muted-foreground mt-2">
                This will create a blockchain-verified certificate on Solana.
              </p>
              {!walletAddress && (
                <p className="text-sm text-orange-600 mt-2">
                  ⚠️ Please link a Solana wallet to mint NFT certificate
                </p>
              )}
            </div>
          )}

          {/* Success Actions */}
          {certificate && (
            <div className="space-y-4">
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Certificate generated successfully! Your emissions data has been verified and recorded on Solana blockchain.
                </AlertDescription>
              </Alert>

              {/* Transaction Links */}
              {(certificate.transactionSignature || certificate.logTransactionSignature) && (
                <div className="grid gap-3 p-4 bg-muted/50 rounded-lg">
                  <div className="text-sm font-medium mb-2">Blockchain Transactions:</div>
                  {certificate.transactionSignature && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">NFT Certificate:</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(getExplorerUrl(certificate.transactionSignature), '_blank')}
                      >
                        <Award className="h-4 w-4 mr-2" />
                        View NFT on Solscan
                      </Button>
                    </div>
                  )}
                  {certificate.logTransactionSignature && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Certificate Log:</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(getExplorerUrl(certificate.logTransactionSignature), '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Log on Solscan
                      </Button>
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-wrap gap-4 justify-center">
                <Button onClick={downloadPDF} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
                <Button variant="outline" onClick={() => copyToClipboard(certificate.certificateId)}>
                  <Copy className="h-4 w-4 mr-2" />
                  {copied ? 'Copied!' : 'Copy Certificate ID'}
                </Button>
                <Button variant="outline">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Certificate
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Emissions Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Emissions Breakdown</CardTitle>
          <CardDescription>
            Detailed breakdown included in your certificate
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(calculations.breakdown || calculations.categoryBreakdown || {}).map(([category, emissions]: [string, any]) => (
              <div key={category} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="font-medium">{category}</span>
                <span className="font-bold">{emissions.toFixed(2)} kg CO₂e</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {copied && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg">
          Copied to clipboard!
        </div>
      )}

      {/* Notification Toast */}
      <NotificationToast
        isVisible={notification.isVisible}
        onClose={() => setNotification(prev => ({ ...prev, isVisible: false }))}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        duration={15000}
      />
    </div>
  );
}