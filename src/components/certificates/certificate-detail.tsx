'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import {
  Award,
  Download,
  Share2,
  ExternalLink,
  Calendar,
  CheckCircle,
  Copy,
  ArrowLeft,
  Leaf,
  Loader2,
  AlertCircle,
  Target,
  Wallet,
  ShoppingCart,
  History,
  Clock,
  Flame,
  RefreshCw,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useRetirement } from '@/hooks/useRetirement';
import { useEscrow } from '@/hooks/useEscrow';
import { useAuth } from '@/hooks/useAuth';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';
import Link from 'next/link';
import { getExplorerUrl } from '@/lib/solana-nft';
import { EmissionEntry } from '@/types/ghg';
import React from 'react';
import { PrivateCertificateViewer } from './private-certificate-viewer';
import { usePrivy } from '@privy-io/react-auth';

interface CertificateDetailProps {
  certificateId: string;
}

// Helper function for PDF download
const downloadCertificatePDF = (certificate: any) => {
  // TODO: Implement PDF generation
  console.log('Download PDF for certificate:', certificate.certificateId);
};

export function CertificateDetail({ certificateId }: CertificateDetailProps) {
  const [copied, setCopied] = useState(false);
  const [showRetirementForm, setShowRetirementForm] = useState(false);
  const [showRetirementHistory, setShowRetirementHistory] = useState(false);
  const [retirementAmount, setRetirementAmount] = useState<string>('');
  const [certificate, setCertificate] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [retirementHistory, setRetirementHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isMintingCertificate, setIsMintingCertificate] = useState(false);

  const { toast } = useToast();
  const { retireCredits, isRetiring, calculateRetirementStatus } = useRetirement();
  const escrow = useEscrow();
  const { walletAddress } = useAuth();
  const { user } = usePrivy(); // Moved here to avoid conditional hook call

  // Fetch certificate data
  React.useEffect(() => {
    const fetchCertificate = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/certificates/${certificateId}`);
        if (response.ok) {
          const data = await response.json();
          setCertificate(data.certificate);
        }
      } catch (error) {
        console.error('Failed to fetch certificate:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCertificate();
  }, [certificateId]);

  // Fetch retirement history from audit logs
  const fetchRetirementHistory = async () => {
    if (!certificate || !walletAddress) return;

    try {
      setIsLoadingHistory(true);

      // Fetch logs for this wallet address
      const response = await fetch(`/api/audit-logs?walletAddress=${walletAddress}`);
      if (response.ok) {
        const data = await response.json();
        // Filter for retirement actions for this certificate
        const retirements = data.logs?.filter((log: any) =>
          log.action === 'RETIRE_CREDITS' &&
          log.details?.certificateId === certificateId
        ) || [];

        console.log('📊 Retirement history:', {
          walletAddress,
          totalLogs: data.logs?.length,
          retirements: retirements.length,
          certificateId,
        });

        setRetirementHistory(retirements);
      }
    } catch (error) {
      console.error('Failed to fetch retirement history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Fetch history when dropdown is opened
  React.useEffect(() => {
    if (showRetirementHistory && certificate) {
      fetchRetirementHistory();
    }
  }, [showRetirementHistory, certificate]);

  const retirementTransactions: any[] = [];
  const isLoadingRetirements = false;

  const handleRetireCredits = async () => {
    const amount = parseFloat(retirementAmount);

    if (!amount || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid retirement amount",
        variant: "destructive",
      });
      return;
    }

    if (amount > certificate.totalEmissions) {
      toast({
        title: "Amount Too Large",
        description: `Cannot retire more than total emissions (${certificate.totalEmissions} kg CO₂e)`,
        variant: "destructive",
      });
      return;
    }

    const currentOffset = certificate.offsetAmount || 0;
    if (currentOffset + amount > certificate.totalEmissions) {
      toast({
        title: "Amount Too Large",
        description: `Can only retire ${(certificate.totalEmissions - currentOffset).toFixed(2)} more kg CO₂e`,
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await retireCredits(
        certificateId,
        amount,
        certificate.totalEmissions
      );

      if (result.success) {
        // Refresh certificate data
        const response = await fetch(`/api/certificates/${certificateId}`);
        if (response.ok) {
          const data = await response.json();
          setCertificate(data.certificate);
        }

        setShowRetirementForm(false);
        setRetirementAmount('');

        // Refresh history if it's open
        if (showRetirementHistory) {
          fetchRetirementHistory();
        }
      }
    } catch (error: any) {
      console.error('Retirement error:', error);
    }
  };

  const handleMintCertificate = async () => {
    if (!certificate) return;

    setIsMintingCertificate(true);

    try {
      const response = await fetch(`/api/certificates/${certificateId}/mint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to mint certificate');
      }

      const data = await response.json();

      toast({
        title: '🎉 Certificate Minted!',
        description: (
          <div className="space-y-1">
            <p>Your offset certificate NFT has been minted! {((certificate.offsetAmount / certificate.totalEmissions) * 100).toFixed(1)}% offset recorded.</p>
            <a
              href={`https://solscan.io/tx/${data.signature}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs underline"
            >
              View on Solscan
            </a>
          </div>
        ),
      });

      // Refresh certificate data
      const certResponse = await fetch(`/api/certificates/${certificateId}`);
      if (certResponse.ok) {
        const certData = await certResponse.json();
        setCertificate(certData.certificate);
      }
    } catch (error: any) {
      console.error('Minting error:', error);
      toast({
        title: 'Minting Failed',
        description: error.message || 'Failed to mint certificate',
        variant: 'destructive',
      });
    } finally {
      setIsMintingCertificate(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-8 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-1/3"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="h-4 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded w-2/3"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!certificate) {
    return (
      <div className="text-center py-12">
        <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">Certificate not found</h3>
        <p className="text-muted-foreground mb-4">
          The certificate you're looking for doesn't exist or has been removed.
        </p>
        <Button asChild>
          <Link href="/certificates">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Certificates
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/certificates">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{certificate.title}</h1>
          <p className="text-muted-foreground">Certificate ID: {certificate.certificate_id}</p>
        </div>
      </div>

      {/* Private Certificate Viewer (if private) */}
      {(() => {
        console.log('🔍 Certificate privacy check:', {
          isPrivate: certificate.isPrivate,
          encryptedDataId: certificate.encryptedDataId,
          userId: certificate.userId,
          currentUserId: user?.id,
        });
        return certificate.isPrivate;
      })() && (
          <PrivateCertificateViewer
            certificate={{
              id: certificate.id,
              certificateId: certificate.certificate_id,
              title: certificate.title,
              totalEmissions: certificate.totalEmissions,
              organizationName: certificate.title.split(' - ')[0],
              isPrivate: certificate.isPrivate,
              encryptedDataId: certificate.encryptedDataId,
              arciumSignature: certificate.arciumSignature,
              arciumDataHash: certificate.arciumDataHash,
              userId: certificate.userId,
              createdAt: certificate.issueDate,
            }}
            currentUserId={user?.id}
          />
        )}

      {/* Certificate Display (public mode or additional info) */}
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950"></div>
        <CardContent className="relative p-8">
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
                    {certificate.totalEmissions.toLocaleString()} kg CO₂e
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {certificate.status}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Issue Date</label>
                  <p className="font-medium">{format(new Date(certificate.issueDate), 'PPP')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Valid Until</label>
                  <p className="font-medium">{format(new Date(certificate.validUntil), 'PPP')}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Categories</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {certificate.breakdown && Object.keys(certificate.breakdown).map((category) => (
                      <Badge key={category} variant="secondary">
                        {category}
                      </Badge>
                    ))}
                    {!certificate.breakdown && (
                      <span className="text-sm text-muted-foreground">No breakdown available</span>
                    )}
                  </div>
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

            <div className="mt-8 pt-6 border-t space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Certificate ID</label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="text-sm bg-muted px-2 py-1 rounded">{certificate.certificateId}</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(certificate.certificateId)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {certificate.dataHash && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Data Hash</label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-sm bg-muted px-2 py-1 rounded font-mono">
                      {certificate.dataHash.substring(0, 16)}...
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(certificate.dataHash)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Blockchain Verification</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadCertificatePDF(certificate)}
                    title="Download Certificate"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  {certificate.blockchainTx && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`https://explorer.solana.com/tx/${certificate.blockchainTx}?cluster=devnet`, '_blank')}
                      title="View NFT Certificate Transaction"
                    >
                      <Award className="h-4 w-4 mr-2" />
                      NFT Certificate
                    </Button>
                  )}
                  {certificate.logTransactionSignature && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`https://explorer.solana.com/tx/${certificate.logTransactionSignature}?cluster=devnet`, '_blank')}
                      title="View Certificate Log on Solscan"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Certificate Log
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Carbon Credit Retirement Section */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
            <Flame className="h-5 w-5" />
            Offset This Certificate
          </CardTitle>
          <CardDescription>
            Retire CO₂e tokens to permanently offset the emissions in this certificate
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Offset Progress */}
          {(() => {
            const offsetAmount = certificate.offsetAmount || 0;
            const { status, percentage, remaining } = calculateRetirementStatus(
              certificate.totalEmissions,
              offsetAmount
            );

            return (
              <div className="bg-white dark:bg-gray-900 p-6 rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Offset Progress</p>
                    <p className="text-2xl font-bold text-green-600">{percentage}%</p>
                  </div>
                  <Badge
                    className={
                      status === 'fully_offset'
                        ? 'bg-green-600'
                        : status === 'partially_offset'
                          ? 'bg-yellow-600'
                          : 'bg-gray-600'
                    }
                  >
                    {status === 'fully_offset' ? '✓ Fully Offset' :
                      status === 'partially_offset' ? 'Partially Offset' :
                        'Not Offset'}
                  </Badge>
                </div>
                <Progress value={percentage} className="h-3" />
                <div className="grid gap-4 md:grid-cols-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Total Emissions</p>
                    <p className="font-bold">{certificate.totalEmissions.toFixed(2)} kg CO₂e</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Offset Amount</p>
                    <p className="font-bold text-green-600">{offsetAmount.toFixed(2)} kg CO₂e</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Remaining</p>
                    <p className="font-bold text-orange-600">{remaining.toFixed(2)} kg CO₂e</p>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* User Balance */}
          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">Your CO₂e Balance</p>
                  <p className="text-xl font-bold text-blue-600">
                    {escrow.loading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      `${escrow.userBalance.toFixed(2)} CO₂e`
                    )}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => escrow.refresh()}
                  disabled={escrow.loading}
                  title="Refresh balance"
                >
                  <RefreshCw className={`h-4 w-4 ${escrow.loading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/marketplace">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Buy More
                </Link>
              </Button>
            </div>
          </div>

          {/* Retirement History Dropdown */}
          {certificate.offsetAmount > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-lg border">
              <button
                onClick={() => setShowRetirementHistory(!showRetirementHistory)}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Retirement History</span>
                  <Badge variant="secondary">{retirementHistory.length}</Badge>
                </div>
                {showRetirementHistory ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>

              {showRetirementHistory && (
                <div className="border-t p-4 space-y-3">
                  {isLoadingHistory ? (
                    <div className="text-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                    </div>
                  ) : retirementHistory.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No retirement history found
                    </p>
                  ) : (
                    retirementHistory.map((log, index) => (
                      <div key={log.id} className="bg-muted/50 rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center text-green-600 font-bold text-xs">
                              {retirementHistory.length - index}
                            </div>
                            <span className="font-medium text-sm">
                              {log.details?.amount} kg CO₂e retired
                            </span>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {log.details?.offsetPercentage}%
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{format(new Date(log.createdAt), 'PPp')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => window.open(`https://solscan.io/tx/${log.transactionSignature}?cluster=devnet`, '_blank')}
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            View Transaction
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          {!showRetirementForm ? (
            <div className="space-y-3">
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowRetirementForm(true)}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  disabled={certificate.offsetAmount >= certificate.totalEmissions}
                >
                  <Flame className="h-4 w-4 mr-2" />
                  Retire CO₂e Credits
                </Button>

                <Button
                  onClick={handleMintCertificate}
                  disabled={certificate.offsetAmount === 0 || isMintingCertificate}
                  className="flex-1"
                  variant="outline"
                  title={certificate.offsetAmount > 0 ? "Mint NFT certificate with current offset progress" : "Offset some credits first to mint certificate"}
                >
                  {isMintingCertificate ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Minting...
                    </>
                  ) : (
                    <>
                      <Award className="h-4 w-4 mr-2" />
                      Mint Certificate NFT
                    </>
                  )}
                </Button>
              </div>

              {certificate.offsetAmount >= certificate.totalEmissions && (
                <p className="text-sm text-green-600 font-medium text-center">
                  ✓ Certificate fully offset!
                </p>
              )}

              {certificate.offsetAmount === 0 && (
                <p className="text-xs text-muted-foreground text-center">
                  Mint certificate button will be enabled after you offset any amount
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="retirement-amount">Amount to Retire (CO₂e tokens)</Label>
                <Input
                  id="retirement-amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  max={Math.min(
                    escrow.userBalance,
                    certificate.totalEmissions - (certificate.offsetAmount || 0)
                  )}
                  value={retirementAmount}
                  onChange={(e) => setRetirementAmount(e.target.value)}
                  placeholder="Enter amount to retire"
                  disabled={isRetiring}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Your balance: {escrow.userBalance.toFixed(2)} CO₂e</span>
                  <span>
                    Can retire: {Math.min(
                      escrow.userBalance,
                      certificate.totalEmissions - (certificate.offsetAmount || 0)
                    ).toFixed(2)} CO₂e
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleRetireCredits}
                  disabled={!retirementAmount || parseFloat(retirementAmount) <= 0 || isRetiring}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {isRetiring ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Retiring...
                    </>
                  ) : (
                    <>
                      <Flame className="h-4 w-4 mr-2" />
                      Retire {retirementAmount || '0'} CO₂e
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowRetirementForm(false);
                    setRetirementAmount('');
                  }}
                  disabled={isRetiring}
                >
                  Cancel
                </Button>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p className="font-medium">What happens when you retire:</p>
                    <ul className="text-sm space-y-1">
                      <li>✓ CO₂e tokens are permanently burned</li>
                      <li>✓ Certificate offset amount is updated</li>
                      <li>✓ Transaction logged on Solana blockchain</li>
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Retirement History Section */}
      {certificate && retirementTransactions && retirementTransactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-blue-600" />
              Retirement History
            </CardTitle>
            <CardDescription>
              Complete history of carbon credit retirements for this certificate
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {retirementTransactions.map((transaction, index) => (
                <div key={transaction.id} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center text-green-600 font-bold text-sm">
                        #{index + 1}
                      </div>
                      <div>
                        <h4 className="font-semibold text-lg">{transaction.amount} CO2e Credits Retired</h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>{format(new Date(transaction.created_at), 'PPP p')}</span>
                        </div>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      Completed
                    </Badge>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3 text-sm">
                    <div>
                      <label className="text-muted-foreground">Amount Retired:</label>
                      <p className="font-medium text-green-600">{transaction.amount} kg CO₂e</p>
                    </div>
                    <div>
                      <label className="text-muted-foreground">Status:</label>
                      <p className="font-medium text-green-600">Successfully Retired</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <h5 className="font-medium mb-3">Blockchain Verification Links</h5>
                    <div className="grid gap-2 md:grid-cols-3">
                      <div className="col-span-3 text-center py-4">
                        <p className="text-sm text-muted-foreground">
                          Blockchain verification links will be available with Solana integration
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="grid gap-3 md:grid-cols-2 text-xs text-muted-foreground">
                      <div>
                        <span>Transaction ID: </span>
                        <span className="font-mono">{transaction.id.substring(0, 8)}...</span>
                      </div>
                      <div>
                        <span>Processed: </span>
                        <span>{format(new Date(transaction.created_at), 'MMM dd, yyyy')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="mt-6 pt-6 border-t">
              <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
                <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">Retirement Summary</h4>
                <div className="grid gap-4 md:grid-cols-3 text-sm">
                  <div>
                    <span className="text-green-700 dark:text-green-300">Total Retirements:</span>
                    <p className="font-bold text-green-800 dark:text-green-200">
                      {retirementTransactions.length} transactions
                    </p>
                  </div>
                  <div>
                    <span className="text-green-700 dark:text-green-300">Total Amount Retired:</span>
                    <p className="font-bold text-green-800 dark:text-green-200">
                      {retirementTransactions.reduce((sum, t) => sum + t.amount, 0)} kg CO₂e
                    </p>
                  </div>
                  <div>
                    <span className="text-green-700 dark:text-green-300">Latest Retirement:</span>
                    <p className="font-bold text-green-800 dark:text-green-200">
                      {retirementTransactions.length > 0
                        ? format(new Date(retirementTransactions[0].created_at), 'MMM dd, yyyy')
                        : 'None'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Emissions Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Emissions Breakdown</CardTitle>
          <CardDescription>
            Detailed breakdown by category
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {certificate.breakdown && Object.entries(certificate.breakdown).map(([category, emissions]) => (
              <div key={category} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="font-medium">{category}</span>
                <span className="font-bold">{Number(emissions).toFixed(2)} kg CO₂e</span>
              </div>
            ))}
            {!certificate.breakdown && (
              <div className="text-center py-4 text-muted-foreground">
                No emissions breakdown available for this certificate
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Activities - Only show if we have processed data */}
      {certificate && certificate.processedData && Array.isArray(certificate.processedData) && certificate.processedData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Detailed Activities</CardTitle>
            <CardDescription>
              Complete breakdown of all calculated emission activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {certificate.processedData.map((entry: any, index: number) => (
                <div key={entry.id || index} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="font-semibold text-lg">{entry.fuelType || entry.activity}</h4>
                        <Badge
                          variant={entry.scope === 'Scope 1' ? 'default' : 'default'}
                          className={`text-xs ${entry.scope === 'Scope 1' ? 'bg-blue-600' : 'bg-green-600'}`}
                        >
                          {entry.scope}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">
                        {(entry.emissions || entry.amount)?.toFixed(2)} kg CO₂e
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {(((entry.emissions || entry.amount) / certificate.totalEmissions) * 100).toFixed(1)}% of total
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4 text-sm">
                    <div>
                      <label className="text-muted-foreground">Category:</label>
                      <p className="font-medium">{entry.category || 'Other'}</p>
                    </div>
                    {entry.equipmentType && (
                      <div>
                        <label className="text-muted-foreground">Equipment:</label>
                        <p className="font-medium">{entry.equipmentType}</p>
                      </div>
                    )}
                    <div>
                      <label className="text-muted-foreground">Fuel Category:</label>
                      <p className="font-medium">{entry.fuelCategory}</p>
                    </div>
                    <div>
                      <label className="text-muted-foreground">Amount:</label>
                      <p className="font-medium">{entry.amount} {entry.unit_type || entry.unit}</p>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="grid gap-3 md:grid-cols-3 text-xs text-muted-foreground">
                      <div>
                        <span>Emission Factor: </span>
                        <span className="font-mono">
                          {(entry.convertedFactor || entry.emissionFactor || 0).toFixed(6)} kg CO₂e/{entry.unit_type || entry.unit}
                        </span>
                      </div>
                      <div>
                        <span>Calculated: </span>
                        <span>{new Date(entry.timestamp || entry.created_at).toLocaleDateString()}</span>
                      </div>
                      <div>
                        <span>Entry ID: </span>
                        <span className="font-mono">{(entry.id || index).toString().substring(0, 8)}...</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary Statistics */}
            <div className="mt-6 pt-6 border-t">
              <h4 className="font-medium mb-4">Calculation Summary</h4>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {certificate.processedData.filter((e: any) => e.scope === 'Scope 1').length}
                  </div>
                  <div className="text-sm text-blue-700 dark:text-blue-300">Scope 1 Activities</div>
                  <div className="text-xs text-blue-600">
                    {(certificate.processedData
                      .filter((e: any) => e.scope === 'Scope 1')
                      .reduce((sum: number, e: any) => sum + (e.emissions || e.amount || 0), 0) / 1000).toFixed(2)} tonnes CO₂e
                  </div>
                </div>
                <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {certificate.processedData.filter((e: any) => e.scope === 'Scope 2').length}
                  </div>
                  <div className="text-sm text-green-700 dark:text-green-300">Scope 2 Activities</div>
                  <div className="text-xs text-green-600">
                    {(certificate.processedData
                      .filter((e: any) => e.scope === 'Scope 2')
                      .reduce((sum: number, e: any) => sum + (e.emissions || e.amount || 0), 0) / 1000).toFixed(2)} tonnes CO₂e
                  </div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {new Set(certificate.processedData.map((e: any) => e.category)).size}
                  </div>
                  <div className="text-sm text-purple-700 dark:text-purple-300">Categories Used</div>
                  <div className="text-xs text-purple-600">
                    {(certificate.totalEmissions / 1000).toFixed(2)} tonnes CO₂e total
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Organizational Details */}
      {certificate && certificate.summary && (
        <Card>
          <CardHeader>
            <CardTitle>Assessment Details</CardTitle>
            <CardDescription>
              GHG assessment configuration and scope
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Organization</label>
                  <p className="font-medium">{certificate.summary?.questionnaire?.orgName || certificate.summary?.orgName || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Boundary Approach</label>
                  <p className="font-medium">{certificate.summary?.questionnaire?.boundaryApproach || certificate.summary?.boundaryApproach || 'Not specified'}</p>
                  {(certificate.summary?.questionnaire?.controlSubtype || certificate.summary?.controlSubtype) && (
                    <p className="text-sm text-muted-foreground">→ {certificate.summary?.questionnaire?.controlSubtype || certificate.summary?.controlSubtype}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Operational Boundary</label>
                  <p className="font-medium">{certificate.summary?.questionnaire?.operationalBoundary || certificate.summary?.operationalBoundary || 'Not specified'}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Emission Sources</label>
                  <p className="font-medium">{certificate.summary?.questionnaire?.emissionSources || certificate.summary?.emissionSources || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Total Activities</label>
                  <p className="font-medium">{certificate.processedData?.length || 0} calculations</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Assessment Date</label>
                  <p className="font-medium">
                    {format(new Date(certificate.issueDate), 'PPP')}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-4">
        <Button>
          <Download className="h-4 w-4 mr-2" />
          Download PDF
        </Button>
        <Button variant="outline">
          <Share2 className="h-4 w-4 mr-2" />
          Share Certificate
        </Button>
        <Button variant="outline" asChild>
          <Link href="/marketplace">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Buy Carbon Credits
          </Link>
        </Button>
      </div>

      {copied && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg">
          Copied to clipboard!
        </div>
      )}
    </div>
  );
}