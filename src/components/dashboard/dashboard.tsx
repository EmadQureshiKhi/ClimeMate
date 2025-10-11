'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { StatsCards } from './stats-cards';
import { EmissionsChart } from './emissions-chart';
import { RecentActivity } from './recent-activity';
import { QuickActions } from './quick-actions';
import { Leaf, TrendingDown, Award, ShoppingCart, Wallet } from 'lucide-react';
import Link from 'next/link';

export function Dashboard() {
  // Static demo data for the dashboard
  const staticStatsData = {
    totalEmissions: 1200000, // 1.2M kg
    offsetCredits: 850000, // 850K kg
    certificates: 500,
    marketplaceTransactions: 1200,
    emissionsChange: -15.2,
    offsetsChange: 28.5,
  };

  // Static demo emissions data
  const emissionsData = [
    { month: 'Jan', emissions: 2400, offsets: 1200, net: 1200 },
    { month: 'Feb', emissions: 2100, offsets: 1400, net: 700 },
    { month: 'Mar', emissions: 2800, offsets: 1600, net: 1200 },
    { month: 'Apr', emissions: 2200, offsets: 1800, net: 400 },
    { month: 'May', emissions: 2600, offsets: 2000, net: 600 },
    { month: 'Jun', emissions: 2450, offsets: 1850, net: 600 },
  ];

  // Static demo recent activity data
  const recentActivity = [
    {
      id: '1',
      type: 'certificate',
      title: 'Certificate Generated',
      description: 'Emissions Certificate Verified',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      status: 'completed',
      amount: 2450,
      txHash: '0x1234...5678',
    },
    {
      id: '2',
      type: 'purchase',
      title: 'Carbon Credits Purchased',
      description: 'Renewable Energy Project',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      status: 'completed',
      amount: 500,
      txHash: '0xabcd...efgh',
    },
    {
      id: '3',
      type: 'offset',
      title: 'Credits Retired',
      description: 'Forest Conservation Project',
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'completed',
      amount: 1000,
      txHash: '0x9876...5432',
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-green-600 to-emerald-600 p-8 text-white shadow-2xl">
        {/* Enhanced Background Patterns */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-6 right-20 w-20 h-20 border-2 border-white rounded-full"></div>
          <div className="absolute top-12 right-32 w-12 h-12 border border-white rounded-full"></div>
          <div className="absolute bottom-8 right-24 w-6 h-6 bg-white rounded-full"></div>
          <div className="absolute top-16 right-8 w-8 h-8 border border-white rounded-full"></div>
          <div className="absolute bottom-12 right-40 w-4 h-4 bg-white rounded-full"></div>
          <div className="absolute top-20 left-20 w-16 h-16 border border-white/30 rounded-full"></div>
          <div className="absolute bottom-16 left-32 w-10 h-10 border-2 border-white/40 rounded-full"></div>
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
            Track, Verify, Offset Your Carbon Footprint
          </h1>
          <p className="text-xl opacity-90 mb-6 max-w-2xl">
            Generate verifiable certificates, explore carbon offset projects, and manage your environmental impact with blockchain-powered transparency
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/upload">
              <Button size="lg" variant="secondary" className="bg-white text-green-600 hover:bg-gray-100">
                Upload Emissions Data
              </Button>
            </Link>
            <Link href="/marketplace">
              <Button size="lg" variant="secondary" className="bg-white text-green-600 hover:bg-gray-100">
                Browse Marketplace
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="space-y-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Platform Impact Overview</h2>
          <p className="text-muted-foreground">
            See how organizations worldwide are making a difference
          </p>
        </div>
        <StatsCards data={staticStatsData} />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Emissions Chart */}
        <div className="lg:col-span-2">
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-1">Emissions Tracking</h3>
            <p className="text-sm text-muted-foreground">
              See how emissions and offsets are tracked over time
            </p>
          </div>
          <EmissionsChart data={emissionsData} />
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <QuickActions />
          
          {/* Get Started Card */}
          <Card className="mt-16">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-blue-600" />
                Get Started Today
              </CardTitle>
              <CardDescription>
                Join thousands of organizations tracking their impact
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-bold text-sm">1</span>
                  </div>
                  <span className="text-sm">Upload your emissions data</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-sm">2</span>
                  </div>
                  <span className="text-sm">Generate verified certificates</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 font-bold text-sm">3</span>
                  </div>
                  <span className="text-sm">Offset with carbon credits</span>
                </div>
              </div>
              <Button className="w-full" size="sm" asChild>
                <Link href="/upload">
                  <Award className="h-4 w-4 mr-2" />
                  Start Your Journey
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="space-y-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Platform Activity</h2>
          <p className="text-muted-foreground">
            Recent activities from our community of sustainable organizations
          </p>
        </div>
        <RecentActivity data={recentActivity} />
      </div>
    </div>
  );
}