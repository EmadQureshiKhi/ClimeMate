'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, AlertCircle, ExternalLink, Shield, Copy, Check } from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface BlockchainLog {
  transactionSignature: string;
  action: string;
  dataHash: string;
  timestamp: string;
  status: 'pending' | 'success' | 'error';
  error?: string;
}

interface BlockchainVerificationCardProps {
  logs: BlockchainLog[];
  isLogging?: boolean;
  module: string;
}

export function BlockchainVerificationCard({ 
  logs, 
  isLogging = false,
  module 
}: BlockchainVerificationCardProps) {
  const latestLog = logs[0];
  const hasLogs = logs.length > 0;
  const { toast } = useToast();
  const [copiedTxId, setCopiedTxId] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);

  // Copy to clipboard helper
  const copyToClipboard = async (text: string, type: 'txId' | 'hash') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'txId') {
        setCopiedTxId(true);
        setTimeout(() => setCopiedTxId(false), 2000);
      } else {
        setCopiedHash(true);
        setTimeout(() => setCopiedHash(false), 2000);
      }
      toast({
        title: "Copied!",
        description: `${type === 'txId' ? 'Transaction ID' : 'Data hash'} copied to clipboard`,
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  // Format action text - convert to noun form (addition/deletion/update)
  const formatActionText = (action: string) => {
    const actionMap: Record<string, string> = {
      'stakeholder_added': 'Stakeholder addition',
      'stakeholder_updated': 'Stakeholder update',
      'stakeholder_deleted': 'Stakeholder deletion',
      'client_added': 'Client addition',
      'client_updated': 'Client update',
      'client_deleted': 'Client deletion',
    };
    
    return actionMap[action] || action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Determine card status
  const getStatusColor = () => {
    if (isLogging) return 'border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800';
    if (!hasLogs) return 'border-gray-200 bg-gray-50 dark:bg-gray-900 dark:border-gray-800';
    if (latestLog?.status === 'error') return 'border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800';
    return 'border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800';
  };

  const getStatusIcon = () => {
    if (isLogging) return <Clock className="h-5 w-5 text-yellow-600 animate-pulse" />;
    if (!hasLogs) return <Shield className="h-5 w-5 text-gray-400" />;
    if (latestLog?.status === 'error') return <AlertCircle className="h-5 w-5 text-red-600" />;
    return <CheckCircle className="h-5 w-5 text-emerald-600" />;
  };

  const getStatusBadge = () => {
    if (isLogging) return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Pending</Badge>;
    if (!hasLogs) return <Badge variant="outline">No Transactions</Badge>;
    if (latestLog?.status === 'error') return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Error</Badge>;
    return <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">Verified</Badge>;
  };

  return (
    <Card className={`${getStatusColor()} border-2`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <CardTitle className="text-lg">
                {module} Verification
              </CardTitle>
              <CardDescription>
                {isLogging && 'Logging action to Solana blockchain...'}
                {!isLogging && !hasLogs && 'No Solana transactions yet. Perform an action to see verification.'}
                {!isLogging && hasLogs && latestLog?.status === 'success' && 'Latest action logged to Solana blockchain'}
                {!isLogging && hasLogs && latestLog?.status === 'error' && 'Failed to log action to blockchain'}
              </CardDescription>
            </div>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>

      {(hasLogs || isLogging) && (
        <CardContent className="space-y-3">
          {isLogging && (
            <div className="flex items-center gap-2 text-sm text-yellow-700 dark:text-yellow-300">
              <Clock className="h-4 w-4 animate-spin" />
              <span>Waiting for wallet signature...</span>
            </div>
          )}

          {!isLogging && latestLog && (
            <>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-900 dark:text-gray-100 mb-1 font-medium">🔗 Transaction ID</p>
                  {latestLog.status === 'success' ? (
                    <div className="flex items-center gap-1">
                      <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded border flex-1">
                        {latestLog.transactionSignature.substring(0, 8)}...{latestLog.transactionSignature.substring(latestLog.transactionSignature.length - 6)}
                      </code>
                      <a
                        href={`https://explorer.solana.com/tx/${latestLog.transactionSignature}?cluster=devnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button size="sm" variant="ghost" className="h-6 px-2">
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </a>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-6 px-2"
                        onClick={() => copyToClipboard(latestLog.transactionSignature, 'txId')}
                      >
                        {copiedTxId ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                      </Button>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">pending</p>
                  )}
                </div>

                <div>
                  <p className="text-gray-900 dark:text-gray-100 mb-1 font-medium"># Data Hash</p>
                  <div className="flex items-center gap-1">
                    <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded border flex-1 truncate">
                      {latestLog.dataHash.substring(0, 16)}...
                    </code>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-6 px-2"
                      onClick={() => copyToClipboard(latestLog.dataHash, 'hash')}
                    >
                      {copiedHash ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>

                <div>
                  <p className="text-muted-foreground mb-1">Action</p>
                  <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                    {latestLog.action}
                  </span>
                </div>

                <div>
                  <p className="text-muted-foreground mb-1">Timestamp</p>
                  <p className="text-sm font-medium">
                    {format(new Date(latestLog.timestamp), 'PPp')}
                  </p>
                </div>
              </div>

              {/* Success message */}
              {latestLog.status === 'success' && (
                <div className="mt-4 pt-4 border-t border-emerald-200 dark:border-emerald-800">
                  <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300">
                    <CheckCircle className="h-4 w-4" />
                    <span className="font-medium">
                      {formatActionText(latestLog.action)} successfully logged to Solana blockchain
                    </span>
                  </div>
                </div>
              )}

              {latestLog.status === 'error' && latestLog.error && (
                <div className="mt-3 p-3 bg-red-100 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-800 dark:text-red-200">
                    <strong>Error:</strong> {latestLog.error}
                  </p>
                </div>
              )}


            </>
          )}
        </CardContent>
      )}
    </Card>
  );
}
