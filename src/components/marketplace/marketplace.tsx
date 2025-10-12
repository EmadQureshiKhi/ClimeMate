'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { 
  ShoppingCart, 
  Search, 
  Filter,
  Leaf,
  TrendingUp,
  Star,
  MapPin,
  Calendar,
  Wallet,
  Loader2,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { format } from 'date-fns';

export function Marketplace() {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [purchasingCredit, setPurchasingCredit] = useState<string | null>(null);
  const { toast } = useToast();
  const { walletAddress } = useAuth();
  
  // Mock carbon credits data
  const credits = [
    {
      id: 'credit-1',
      title: 'Amazon Rainforest Conservation',
      description: 'Protecting 10,000 hectares of pristine Amazon rainforest from deforestation',
      price: 25.50,
      price_unit: 'per tonne CO₂e',
      available: 5000,
      total_supply: 10000,
      project_type: 'Forest Conservation',
      location: 'Brazil',
      vintage: '2024',
      rating: 4.8,
      verified: true,
      image_url: 'https://images.pexels.com/photos/975771/pexels-photo-975771.jpeg',
      created_at: new Date().toISOString(),
    },
    {
      id: 'credit-2',
      title: 'Solar Farm Development',
      description: 'Large-scale solar energy project generating clean electricity for 50,000 homes',
      price: 18.75,
      price_unit: 'per tonne CO₂e',
      available: 8500,
      total_supply: 15000,
      project_type: 'Renewable Energy',
      location: 'India',
      vintage: '2024',
      rating: 4.6,
      verified: true,
      image_url: 'https://images.pexels.com/photos/433308/pexels-photo-433308.jpeg',
      created_at: new Date().toISOString(),
    }
  ];
  
  const isLoading = false;

  const projectTypes = ['all', 'Forest Conservation', 'Renewable Energy', 'Reforestation', 'Waste Management', 'Ocean Conservation'];

  const filteredCredits = credits?.filter(credit => {
    const matchesSearch = credit.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         credit.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         credit.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || credit.project_type === typeFilter;
    return matchesSearch && matchesType;
  }) || [];

  const handlePurchase = async (creditId: string, price: number) => {
    // Check if wallet is connected - will show modal if not
    const hasWallet = walletAddress !== undefined;
    
    if (!hasWallet) {
      toast({
        title: "Wallet Required",
        description: "Please link a Solana wallet to purchase carbon credits.",
        variant: "destructive",
      });
      return;
    }

    const amount = 100; // Default purchase amount
    setPurchasingCredit(creditId);

    try {
      // Mock purchase for demo
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast({
        title: "Purchase Successful!",
        description: `Successfully purchased ${amount} carbon credits. Blockchain integration coming soon!`,
      });
    } catch (error: any) {
      toast({
        title: "Purchase Failed",
        description: error.message || "Failed to purchase carbon credits",
        variant: "destructive",
      });
    } finally {
      setPurchasingCredit(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Carbon Credit Marketplace</h1>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-48 bg-muted rounded-t-lg"></div>
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-600"></div>
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-6 right-20 w-20 h-20 border-2 border-white rounded-full"></div>
          <div className="absolute top-12 right-32 w-12 h-12 border border-white rounded-full"></div>
          <div className="absolute bottom-8 right-24 w-6 h-6 bg-white rounded-full"></div>
          <div className="absolute top-16 right-8 w-8 h-8 border border-white rounded-full"></div>
          <div className="absolute bottom-12 right-40 w-4 h-4 bg-white rounded-full"></div>
        </div>
        
        {/* Main Icon */}
        <div className="absolute top-1/2 right-8 transform -translate-y-1/2">
          <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center backdrop-blur-sm border-2 border-white border-opacity-30">
            <Leaf className="w-10 h-10 text-white" />
          </div>
        </div>
        
        <CardContent className="relative z-10 py-8 px-6 text-white">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-extrabold text-white mb-6 tracking-tight leading-tight">
              Carbon Credit Marketplace
            </h1>
            <p className="text-lg text-green-50 leading-relaxed mb-8 font-medium max-w-xl">
              Purchase verified carbon credits to offset your emissions and support sustainable projects worldwide
            </p>
            <div className="flex gap-6 mt-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-300 rounded-full"></div>
                <span className="text-green-100 font-semibold text-xs tracking-wide">Verified Projects</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-300 rounded-full"></div>
                <span className="text-green-100 font-semibold text-xs tracking-wide">Blockchain Secured</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-300 rounded-full"></div>
                <span className="text-green-100 font-semibold text-xs tracking-wide">Global Impact</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Available Credits</p>
                <p className="text-2xl font-bold">
                  {credits?.reduce((sum, credit) => sum + credit.available, 0).toLocaleString()}
                </p>
              </div>
              <Leaf className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Projects</p>
                <p className="text-2xl font-bold">{credits?.length || 0}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg. Price</p>
                <p className="text-2xl font-bold">
                  ${credits ? (credits.reduce((sum, credit) => sum + credit.price, 0) / credits.length).toFixed(2) : '0'}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Countries</p>
                <p className="text-2xl font-bold">
                  {new Set(credits?.map(credit => credit.location)).size || 0}
                </p>
              </div>
              <MapPin className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {projectTypes.map((type) => (
                <Button
                  key={type}
                  variant={typeFilter === type ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTypeFilter(type)}
                >
                  {type === 'all' ? 'All Types' : type}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Credits Grid */}
      {filteredCredits.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No credits found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search or filters to find carbon credits
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredCredits.map((credit) => (
            <Card key={credit.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative h-48 overflow-hidden">
                <img
                  src={credit.image_url}
                  alt={credit.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 right-4">
                  {credit.verified && (
                    <Badge className="bg-green-600 text-white">
                      Verified
                    </Badge>
                  )}
                </div>
              </div>
              <CardHeader>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">{credit.project_type}</Badge>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">{credit.rating}</span>
                    </div>
                  </div>
                  <CardTitle className="text-lg">{credit.title}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {credit.description}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Location</span>
                    <span className="font-medium flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {credit.location}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Vintage</span>
                    <span className="font-medium flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {credit.vintage}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Token ID</span>
                    <Badge variant="outline" className="text-xs">
                      Solana Soon
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Available</span>
                    <span className="font-medium">
                      {credit.available.toLocaleString()} / {credit.total_supply.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-2xl font-bold text-primary">
                        ${credit.price}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {credit.price_unit}
                      </p>
                    </div>
                    <Button 
                      onClick={() => handlePurchase(credit.id, credit.price)}
                      disabled={purchasingCredit === credit.id}
                    >
                      {purchasingCredit === credit.id ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Purchasing...
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Buy Credits
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}