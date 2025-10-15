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
import { mintCertificateNFT, getExplorerUrl, getNFTExplorerUrl, type CertificateMetadata } from '@/lib/solana-nft';

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
  
  // Check if we have a valid emission data ID
  const hasValidEmissionDataId = emissionDataId && emissionDataId !== 'temp-emission-id' && emissionDataId.length > 10;
  

  const generateCertificate = async () => {
    if (!userId) {
      alert('Please login to generate certificate');
      return;
    }

    if (!walletAddress) {
      alert('Please link a Solana wallet to mint NFT certificate');
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

      // 2. Mint NFT on Solana
      const wallet = wallets[0];
      if (!wallet) {
        throw new Error('No wallet connected');
      }

      const certificateMetadata: CertificateMetadata = {
        certificateId,
        title,
        totalEmissions: calculations.totalEmissions,
        breakdown,
        issueDate: new Date().toISOString(),
      };

      const nftResult = await mintCertificateNFT(
        walletAddress,
        certificateMetadata,
        async (txData: any) => {
          // Sign and send transaction with user's wallet
          const result = await wallet.signAndSendTransaction(txData);
          return result;
        }
      );

      if (!nftResult.success) {
        throw new Error(nftResult.error || 'Failed to mint NFT');
      }

      console.log('✅ NFT minted successfully:', nftResult);

      // 3. Save certificate to database
      const response = await fetch('/api/certificates/create', {
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
          dataHash,
          blockchainTx: nftResult.transactionSignature,
          nftAddress: nftResult.nftAddress,
          metadataUri: nftResult.metadataUri,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save certificate to database');
      }

      const { certificate: savedCertificate } = await response.json();
      console.log('✅ Certificate saved to database:', savedCertificate);

      // 4. Set certificate state
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
      alert(`Failed to create certificate: ${error.message || 'Unknown error'}`);
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
              {certificate.transactionSignature && (
                <div className="grid gap-3 p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Blockchain Transaction:</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(getExplorerUrl(certificate.transactionSignature), '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View on Solana Explorer
                    </Button>
                  </div>
                  {certificate.nftAddress && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">NFT Certificate:</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(getNFTExplorerUrl(certificate.nftAddress), '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View NFT
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
    </div>
  );
}