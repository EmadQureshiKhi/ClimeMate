'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { GatewayStatusBadge } from '@/components/gateway/gateway-status-badge';
import { useAuth } from '@/hooks/useAuth';
import { useWallets } from '@privy-io/react-auth/solana';
import { Connection } from '@solana/web3.js';
import {
  Leaf,
  ShoppingCart,
  TrendingUp,
  Award,
  CheckCircle,
  Wind,
  Sun,
  Trees,
  Waves,
  Factory,
  Loader2,
  RefreshCw,
  Search,
  Filter,
  Wallet,
} from 'lucide-react';
import { getCarbonProjects, type CarbonProject } from '@/lib/co2e-token';
import { useToast } from '@/hooks/use-toast';
import { useEscrow } from '@/hooks/useEscrow';

const projectIcons = {
  solar: Sun,
  wind: Wind,
  reforestation: Trees,
  ocean: Waves,
  'direct-air-capture': Factory,
};

export default function MarketplacePage() {
  const { walletAddress } = useAuth();
  const { wallets } = useWallets();
  const { toast } = useToast();
  const escrow = useEscrow();
  const [projects] = useState<CarbonProject[]>(getCarbonProjects());
  const [selectedProject, setSelectedProject] = useState<CarbonProject | null>(null);
  const [purchaseAmount, setPurchaseAmount] = useState('1');
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');

  // Filter projects
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'all' || project.type === selectedType;
    return matchesSearch && matchesType;
  });

  // Calculate total supply
  const totalSupply = projects.reduce((sum, p) => sum + p.availableSupply, 0);

  const handlePurchase = async (project: CarbonProject) => {
    if (!walletAddress) {
      toast({
        title: 'Wallet Required',
        description: 'Please connect your wallet to purchase CO₂e tokens',
        variant: 'destructive',
      });
      return;
    }

    const tokens = parseFloat(purchaseAmount);
    if (isNaN(tokens) || tokens <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid amount',
        variant: 'destructive',
      });
      return;
    }

    // Convert tokens to smallest units (multiply by 100 for 2 decimals)
    const amount = escrow.tokensToSmallestUnit(tokens);

    console.log('🔍 CONVERSION DEBUG:');
    console.log('  Input (purchaseAmount):', purchaseAmount);
    console.log('  Parsed (tokens):', tokens);
    console.log('  TOKEN_DECIMALS:', 2);
    console.log('  Calculation:', `${tokens} × 10^2 = ${tokens} × 100 = ${amount}`);
    console.log('  Final amount (smallest units):', amount);

    setIsPurchasing(true);

    try {
      console.log('🛒 Purchasing from escrow...');
      console.log(`  Tokens: ${tokens}, Smallest units: ${amount}`);
      
      // Calculate cost
      const { costInSOL } = await escrow.getCost(amount);
      console.log(`💰 Cost: ${costInSOL} SOL`);

      // Buy tokens from escrow (instant atomic swap!)
      const result = await escrow.buyTokens(amount);

      if (!result.success) {
        throw new Error(result.error || 'Purchase failed');
      }

      // Log to audit logs
      try {
        const logResponse = await fetch('/api/audit-logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            module: 'MARKETPLACE',
            action: 'TOKEN_PURCHASE',
            transactionSignature: result.signature,
            details: {
              type: 'BUY_CO2E_TOKENS',
              amount: tokens,
              cost: costInSOL,
              costSOL: `${costInSOL.toFixed(5)} SOL`,
              project: selectedProject.name,
              projectType: selectedProject.type,
            },
            userWalletAddress: walletAddress,
            status: 'success',
          }),
        });
        
        if (logResponse.ok) {
          console.log('✅ Purchase logged to audit logs');
        } else {
          const errorData = await logResponse.json();
          console.error('⚠️  Failed to log to audit logs:', errorData);
        }
      } catch (logError) {
        console.error('⚠️  Failed to log to audit logs:', logError);
        // Don't fail the purchase if logging fails
      }

      toast({
        title: 'Purchase Successful! 🎉',
        description: (
          <div className="space-y-1">
            <p>Bought {tokens.toFixed(2)} CO₂e tokens instantly!</p>
            <p className="text-xs">Cost: {costInSOL.toFixed(5)} SOL</p>
            <a 
              href={`https://solscan.io/tx/${result.signature}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs underline block mt-1"
            >
              View on Solscan →
            </a>
          </div>
        ),
      });

      setSelectedProject(null);
      setPurchaseAmount('1');
    } catch (error: any) {
      console.error('❌ Purchase error:', error);
      console.error('Error stack:', error.stack);
      toast({
        title: 'Purchase Failed',
        description: (
          <div className="space-y-1">
            <p>{error.message || 'Failed to purchase tokens'}</p>
            <p className="text-xs opacity-75">Check console for details</p>
          </div>
        ),
        variant: 'destructive',
      });
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-green-600 to-emerald-600 p-8 text-white shadow-2xl">
          {/* Background Patterns */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-6 right-20 w-20 h-20 border-2 border-white rounded-full"></div>
            <div className="absolute top-12 right-32 w-12 h-12 border border-white rounded-full"></div>
            <div className="absolute bottom-8 right-24 w-6 h-6 bg-white rounded-full"></div>
            <div className="absolute top-16 right-8 w-8 h-8 border border-white rounded-full"></div>
            <div className="absolute bottom-12 right-40 w-4 h-4 bg-white rounded-full"></div>
          </div>
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/30 via-transparent to-emerald-700/20"></div>
          
          {/* Main Icon */}
          <div className="absolute top-1/2 right-8 transform -translate-y-1/2">
            <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center backdrop-blur-sm border-2 border-white border-opacity-30">
              <Leaf className="w-10 h-10 text-white" />
            </div>
          </div>
          
          <div className="relative z-10 max-w-4xl">
            <h1 className="text-4xl font-bold mb-4">
              Carbon Credit Marketplace
            </h1>
            <p className="text-xl opacity-90 mb-6 max-w-2xl">
              Purchase verified carbon credits to offset your emissions and support sustainable projects worldwide
            </p>

            {/* Feature Badges */}
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Verified Projects</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                <Award className="h-4 w-4" />
                <span className="text-sm font-medium">Blockchain Secured</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm font-medium">Global Impact</span>
              </div>
            </div>
          </div>
        </div>

        {/* Balance & Stats Row - Outside green box */}
        <div className="grid gap-4 md:grid-cols-5">
          {/* Balance Card */}
          {walletAddress && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Wallet className="h-6 w-6 text-green-600" />
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => escrow.refresh()} 
                      disabled={escrow.loading}
                    >
                      <RefreshCw className={`h-3 w-3 ${escrow.loading ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">CO₂e Balance</p>
                  <p className="text-2xl font-bold text-green-600">
                    {escrow.loading ? (
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    ) : (
                      `${escrow.userBalance.toFixed(2)}`
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Projects */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Award className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-muted-foreground">Projects</p>
                <p className="text-2xl font-bold">{projects.length}</p>
              </div>
            </CardContent>
          </Card>

          {/* Avg Price */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <ShoppingCart className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-muted-foreground">Avg. Price</p>
                <p className="text-2xl font-bold">
                  ${((projects.reduce((sum, p) => sum + p.pricePerToken, 0) / projects.length / 1000000000) * 200).toFixed(2)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Total Supply */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <TrendingUp className="h-6 w-6 text-orange-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-muted-foreground">Total Supply</p>
                <p className="text-2xl font-bold">
                  {(totalSupply / 1000).toFixed(0)}K
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Countries */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Leaf className="h-6 w-6 text-green-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-muted-foreground">Countries</p>
                <p className="text-2xl font-bold">
                  {new Set(projects.map(p => p.location.split(',').pop()?.trim())).size}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search projects by name or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={selectedType === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedType('all')}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  All
                </Button>
                <Button
                  variant={selectedType === 'solar' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedType('solar')}
                >
                  Solar
                </Button>
                <Button
                  variant={selectedType === 'wind' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedType('wind')}
                >
                  Wind
                </Button>
                <Button
                  variant={selectedType === 'reforestation' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedType('reforestation')}
                >
                  Forest
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Projects Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => {
              const Icon = projectIcons[project.type];
              
              return (
                <Card key={project.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="h-48 overflow-hidden relative">
                    <img
                      src={project.image}
                      alt={project.name}
                      className="w-full h-full object-cover"
                    />
                    {/* Verified Badge */}
                    <div className="absolute top-2 right-2 bg-green-600 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-lg">
                      <CheckCircle className="h-3 w-3" />
                      Verified
                    </div>
                  </div>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          <Icon className="h-5 w-5 text-green-600" />
                          {project.name}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {project.location}
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {project.type.replace('-', ' ')}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {project.description}
                    </p>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Available Supply</span>
                        <span className="font-medium">
                          {(project.availableSupply / 1000).toFixed(0)}K tokens
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Price per Token</span>
                        <span className="font-medium">
                          {(project.pricePerToken / 1000000000).toFixed(6)} SOL
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Total Offset</span>
                        <span className="font-medium text-green-600">
                          {(project.totalOffset / 1000).toFixed(0)}K kg CO₂e
                        </span>
                      </div>
                    </div>

                    <div className="pt-2">
                      <Badge variant="secondary" className="w-full justify-center">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {project.verificationStandard}
                      </Badge>
                    </div>

                    <Button
                      className="w-full"
                      onClick={() => setSelectedProject(project)}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Buy CO₂e Tokens
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

        {/* Purchase Modal */}
        {selectedProject && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-md w-full">
              <CardHeader>
                <CardTitle>Purchase CO₂e Tokens</CardTitle>
                <CardDescription>
                  {selectedProject.name}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Amount (CO₂e tokens)</label>
                  <Input
                    type="number"
                    value={purchaseAmount}
                    onChange={(e) => setPurchaseAmount(e.target.value)}
                    placeholder="1.00"
                    min="0.01"
                    step="0.01"
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    1 token = 1 kg CO₂e offset capacity
                  </p>
                </div>

                <div className="space-y-2 p-4 bg-muted rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span>Amount:</span>
                    <span className="font-medium">{(parseFloat(purchaseAmount) || 0).toFixed(2)} CO₂e</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Price per token:</span>
                    <span className="font-medium">
                      {(selectedProject.pricePerToken / 1000000000).toFixed(6)} SOL
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-bold pt-2 border-t">
                    <span>Total:</span>
                    <span>
                      {((parseFloat(purchaseAmount) || 0) * selectedProject.pricePerToken / 1000000000).toFixed(6)} SOL
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setSelectedProject(null)}
                    disabled={isPurchasing}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => handlePurchase(selectedProject)}
                    disabled={isPurchasing}
                  >
                    {isPurchasing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Confirm Purchase'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}