'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { 
  FileText, 
  ExternalLink, 
  Copy, 
  CheckCircle, 
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Filter,
  Calendar
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface AuditLog {
  id: string;
  module: string;
  action: string;
  transactionSignature: string;
  dataHash: string;
  details: any;
  userWalletAddress: string;
  status: string;
  error?: string;
  createdAt: string;
}

export default function LogsPage() {
  const { user, walletAddress } = useAuth();
  const { toast } = useToast();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [filterModule, setFilterModule] = useState<string>('all');

  useEffect(() => {
    if (walletAddress) {
      fetchLogs();
    }
  }, [walletAddress]);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/logs?walletAddress=${walletAddress}`);
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  const getModuleColor = (module: string) => {
    const colors: Record<string, string> = {
      'Admin Panel': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'Stakeholder Management': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'Sample Size Calculator': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'Questionnaire Engine': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'Internal Assessment': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      'Reporting Dashboard': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
      'Certificate': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
    };
    return colors[module] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  const getActionIcon = (action: string) => {
    if (action.includes('certificate') || action.includes('created') || action.includes('added')) return '➕';
    if (action.includes('updated')) return '✏️';
    if (action.includes('deleted')) return '🗑️';
    if (action.includes('finalized')) return '✅';
    return '📝';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const modules = ['all', ...Array.from(new Set(logs.map(log => log.module)))];
  const filteredLogs = filterModule === 'all' 
    ? logs 
    : logs.filter(log => log.module === filterModule);

  if (!walletAddress) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Wallet Required</h3>
              <p className="text-muted-foreground">
                Please connect your wallet to view audit logs
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Audit Logs</h1>
          <p className="text-muted-foreground">
            Complete blockchain-verified history of all your actions
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Logs</p>
                  <p className="text-2xl font-bold">{logs.length}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Successful</p>
                  <p className="text-2xl font-bold text-green-600">
                    {logs.filter(l => l.status === 'success').length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Today</p>
                  <p className="text-2xl font-bold">
                    {logs.filter(l => {
                      const logDate = new Date(l.createdAt);
                      const today = new Date();
                      return logDate.toDateString() === today.toDateString();
                    }).length}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Modules</p>
                  <p className="text-2xl font-bold">
                    {new Set(logs.map(l => l.module)).size}
                  </p>
                </div>
                <Filter className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Filter by Module</CardTitle>
                <CardDescription>View logs from specific modules</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {modules.map((module) => (
                <Button
                  key={module}
                  variant={filterModule === module ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterModule(module)}
                >
                  {module === 'all' ? 'All Modules' : module}
                  {module !== 'all' && (
                    <Badge variant="secondary" className="ml-2">
                      {logs.filter(l => l.module === module).length}
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Logs List */}
        <Card>
          <CardHeader>
            <CardTitle>Activity Timeline</CardTitle>
            <CardDescription>
              {filteredLogs.length} {filteredLogs.length === 1 ? 'log' : 'logs'} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-spin" />
                <p className="text-muted-foreground">Loading logs...</p>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No logs found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                  >
                    {/* Log Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="text-2xl mt-1">{getActionIcon(log.action)}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={getModuleColor(log.module)}>
                              {log.module}
                            </Badge>
                            <span className="text-sm font-medium">{log.action}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(log.createdAt)} • {new Date(log.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                      >
                        {expandedLog === log.id ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </div>

                    {/* Transaction Info */}
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <Badge variant={log.status === 'success' ? 'default' : 'destructive'}>
                        {log.status === 'success' ? (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        ) : (
                          <AlertCircle className="h-3 w-3 mr-1" />
                        )}
                        {log.status}
                      </Badge>
                      
                      {/* Memo Transaction */}
                      {log.transactionSignature && (
                        <>
                          <span className="text-xs text-muted-foreground">Memo:</span>
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {log.transactionSignature.slice(0, 8)}...{log.transactionSignature.slice(-8)}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(log.transactionSignature, 'Memo transaction')}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                          >
                            <a
                              href={`https://explorer.solana.com/tx/${log.transactionSignature}?cluster=devnet`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </Button>
                        </>
                      )}
                      
                      {/* NFT Transaction if exists */}
                      {log.details?.nftTransactionSignature && (
                        <>
                          <span className="text-xs text-muted-foreground">NFT:</span>
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {log.details.nftTransactionSignature.slice(0, 8)}...{log.details.nftTransactionSignature.slice(-8)}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(log.details.nftTransactionSignature, 'NFT transaction')}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                          >
                            <a
                              href={`https://explorer.solana.com/tx/${log.details.nftTransactionSignature}?cluster=devnet`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </Button>
                        </>
                      )}
                    </div>

                    {/* Expanded Details */}
                    {expandedLog === log.id && (
                      <div className="mt-4 pt-4 border-t space-y-3">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">Data Hash</p>
                          <div className="flex items-center gap-2">
                            <code className="text-xs bg-muted px-2 py-1 rounded flex-1 overflow-x-auto">
                              {log.dataHash}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(log.dataHash, 'Data hash')}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">Wallet Address</p>
                          <div className="flex items-center gap-2">
                            <code className="text-xs bg-muted px-2 py-1 rounded">
                              {log.userWalletAddress}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(log.userWalletAddress, 'Wallet address')}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-2">Audit Details</p>
                          <div className="bg-muted p-3 rounded-lg">
                            <pre className="text-xs overflow-x-auto">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </div>
                        </div>

                        {log.error && (
                          <div>
                            <p className="text-xs font-medium text-red-600 mb-1">Error</p>
                            <p className="text-xs text-red-600 bg-red-50 dark:bg-red-950 p-2 rounded">
                              {log.error}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
