'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Search,
  ExternalLink,
  Award,
  CheckCircle,
  Loader2,
  AlertCircle,
  Copy,
  Calendar,
  Hash
} from 'lucide-react';
import { format } from 'date-fns';
import { getExplorerUrl } from '@/lib/solana-nft';

export default function VerifyPage() {
  const [txId, setTxId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [certificateData, setCertificateData] = useState<any>(null);
  const [nftData, setNftData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSearch = async () => {
    if (!txId.trim()) {
      setError('Please enter a transaction ID');
      return;
    }

    setIsLoading(true);
    setError(null);
    setCertificateData(null);
    setNftData(null);

    try {
      // Fetch transaction data from Solana
      const response = await fetch('/api/verify/transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId: txId.trim() }),
      });

      if (!response.ok) {
        throw new Error('Transaction not found or invalid');
      }

      const data = await response.json();

      if (data.certificateLog) {
        setCertificateData(data.certificateLog);
      }

      if (data.nftMetadata) {
        setNftData(data.nftMetadata);
      }

      if (!data.certificateLog && !data.nftMetadata) {
        setError('No certificate data found in this transaction');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch transaction data');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Award className="h-10 w-10 text-green-600" />
          <h1 className="text-4xl font-bold">Verify Certificate</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Verify any carbon certificate by searching its blockchain transaction ID
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          No login required - all data is publicly verifiable on Solana blockchain
        </p>
      </div>

      {/* Search Box */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Search Transaction</CardTitle>
          <CardDescription>
            Enter the NFT mint or certificate log transaction ID
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Enter transaction signature (e.g., 5mTgAJESkH4uFv2qQPomtec...)"
                value={txId}
                onChange={(e) => setTxId(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={isLoading || !txId.trim()}
              className="bg-green-600 hover:bg-green-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Verify
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Certificate Log Data */}
      {certificateData && (
        <Card className="mb-6 border-green-200 dark:border-green-800">
          <CardHeader className="bg-green-50 dark:bg-green-950">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
                  <CheckCircle className="h-5 w-5" />
                  Certificate Verified
                </CardTitle>
                <CardDescription>
                  This certificate is recorded on Solana blockchain
                </CardDescription>
              </div>
              <Badge className="bg-green-600 text-white">
                Verified
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {/* Certificate Details */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Certificate ID</label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-sm bg-muted px-2 py-1 rounded font-mono">
                      {certificateData.certificateId || certificateData.certId}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(certificateData.certificateId || certificateData.certId)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Total Emissions</label>
                  <p className="text-2xl font-bold text-green-600">
                    {(certificateData.totalEmissions || certificateData.total || 0).toLocaleString()} kg CO₂e
                  </p>
                </div>
                {(certificateData.timestamp || certificateData.ts) && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Issue Date</label>
                    <p className="font-medium">
                      {format(new Date(certificateData.timestamp || certificateData.ts), 'PPP p')}
                    </p>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                {(certificateData.dataHash || certificateData.hash) && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Data Hash</label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-xs bg-muted px-2 py-1 rounded font-mono break-all">
                        {(certificateData.dataHash || certificateData.hash).substring(0, 20)}...
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(certificateData.dataHash || certificateData.hash)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
                {certificateData.version && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Version</label>
                    <p className="font-medium">{certificateData.version}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Type</label>
                  <Badge variant="secondary">{certificateData.type}</Badge>
                </div>
                {certificateData.private === 1 && (
                  <div>
                    <Badge className="bg-purple-600">Private Certificate</Badge>
                  </div>
                )}
              </div>
            </div>

            {/* Emissions Breakdown */}
            {certificateData.breakdown && Object.keys(certificateData.breakdown).length > 0 && (
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-3 block">
                  Emissions Breakdown
                </label>
                <div className="grid gap-2">
                  {Object.entries(certificateData.breakdown).map(([category, emissions]) => (
                    <div
                      key={category}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <span className="font-medium capitalize">{category}</span>
                      <span className="font-bold text-green-600">
                        {Number(emissions).toFixed(2)} kg CO₂e
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Blockchain Link */}
            <div className="pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => window.open(getExplorerUrl(txId), '_blank')}
                className="w-full"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View Transaction on Solscan
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* NFT Data */}
      {nftData && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-blue-600" />
              NFT Certificate Details
            </CardTitle>
            <CardDescription>
              Visual certificate minted as NFT
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Name</label>
                <p className="font-medium">{nftData.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Symbol</label>
                <p className="font-medium">{nftData.symbol}</p>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Description</label>
              <p className="text-sm">{nftData.description}</p>
            </div>
            {nftData.image && (
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Certificate Image
                </label>
                <img
                  src={nftData.image}
                  alt="Certificate"
                  className="w-32 h-32 object-contain bg-muted rounded-lg"
                />
              </div>
            )}
            <div className="pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => window.open(getExplorerUrl(txId), '_blank')}
                className="w-full"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View NFT on Solscan
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* How it Works */}
      {!certificateData && !nftData && !isLoading && (
        <Card>
          <CardHeader>
            <CardTitle>How to Verify</CardTitle>
            <CardDescription>
              Follow these steps to verify a certificate
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center text-green-600 font-bold flex-shrink-0">
                1
              </div>
              <div>
                <h4 className="font-medium mb-1">Get Transaction ID</h4>
                <p className="text-sm text-muted-foreground">
                  Find the transaction ID from your certificate or from the certificate holder
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center text-green-600 font-bold flex-shrink-0">
                2
              </div>
              <div>
                <h4 className="font-medium mb-1">Enter Transaction ID</h4>
                <p className="text-sm text-muted-foreground">
                  Paste the transaction signature in the search box above
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center text-green-600 font-bold flex-shrink-0">
                3
              </div>
              <div>
                <h4 className="font-medium mb-1">View Certificate Data</h4>
                <p className="text-sm text-muted-foreground">
                  See all certificate details including emissions breakdown and blockchain proof
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {copied && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg">
          Copied to clipboard!
        </div>
      )}
    </div>
  );
}
