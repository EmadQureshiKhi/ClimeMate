'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  Zap,
  Battery,
  Leaf,
  Coins,
  MapPin,
  Clock,
  TrendingUp,
  Award,
  Loader2,
  Download,
  RefreshCw,
} from 'lucide-react';
import { useAchievementNotifications } from '@/hooks/useAchievementNotifications';
import { useChargingClaim } from '@/hooks/useChargingClaim';
import { PoweredByBadge } from '@/components/ui/powered-by-badge';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import {
  fetchChargingSessions,
  formatEnergy,
  formatCO2e,
  formatPoints,
  type ChargingSession,
} from '@/lib/decharge-integration';

export default function EVChargingPage() {
  const { walletAddress } = useAuth();
  const { toast } = useToast();
  const { showAchievementUnlock, showLevelUp, showTreesPlanted, showXpGained } = useAchievementNotifications();
  const { claimRewards, loading: claimingRewards } = useChargingClaim();
  const [sessions, setSessions] = useState<ChargingSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [mintingSession, setMintingSession] = useState<string | null>(null);

  // Fetch sessions
  useEffect(() => {
    if (walletAddress) {
      loadSessions();
    }
  }, [walletAddress]);

  const loadSessions = async () => {
    if (!walletAddress) return;
    
    setIsLoading(true);
    try {
      const data = await fetchChargingSessions(walletAddress);
      setSessions(data);
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const syncSessions = async () => {
    if (!walletAddress) return;
    
    setIsSyncing(true);
    try {
      const response = await fetch('/api/charging/sync-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userWallet: walletAddress }),
      });

      if (!response.ok) {
        throw new Error('Failed to sync sessions');
      }

      const data = await response.json();
      
      if (data.newSessions > 0) {
        toast({
          title: '🔄 Sessions Synced!',
          description: `Found ${data.newSessions} new charging sessions.`,
        });
        
        // Show virtual world rewards
        if (data.virtualRewards) {
          const rewards = data.virtualRewards;
          
          // Show XP gained
          if (rewards.xpAwarded > 0) {
            showXpGained(rewards.xpAwarded);
          }
          
          // Show trees planted
          if (rewards.treesPlanted > 0) {
            setTimeout(() => showTreesPlanted(rewards.treesPlanted), 500);
          }
          
          // Show level up
          if (rewards.leveledUp) {
            setTimeout(() => showLevelUp(rewards.newLevel), 1000);
          }
          
          // Show new achievements
          if (rewards.newAchievements && rewards.newAchievements.length > 0) {
            rewards.newAchievements.forEach((achievementId: string, index: number) => {
              setTimeout(() => showAchievementUnlock(achievementId), 1500 + (index * 1000));
            });
          }
        }
        
        // Reload sessions
        await loadSessions();
      } else {
        toast({
          title: '✅ Up to Date',
          description: 'No new charging sessions found',
        });
      }
    } catch (error: any) {
      console.error('Error syncing sessions:', error);
      toast({
        title: 'Sync Failed',
        description: error.message || 'Failed to sync charging sessions',
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleMintCredits = async (session: ChargingSession) => {
    setMintingSession(session.sessionId);
    
    try {
      console.log('🔋 Two-step claim process for session:', session.sessionId);
      
      // Two-step process: 1) User signs memo, 2) Backend transfers tokens
      const result = await claimRewards(
        session.sessionId,
        session.creditsEarned,
        {
          stationId: session.stationId,
          energyKwh: session.energyUsed,
          co2eSaved: session.co2eSaved,
        }
      );
      
      console.log('✅ Claim result:', result);
      
      if (result.success && result.signature) {
        // Queue notifications to show sequentially
        const notifications: Array<() => void> = [];
        
        // Check for virtual world rewards and queue notifications
        if (result.virtualWorldRewards) {
          const rewards = result.virtualWorldRewards;
          
          // 1. Trees planted (if any)
          if (rewards.treesPlanted > 0) {
            notifications.push(() => showTreesPlanted(rewards.treesPlanted));
          }
          
          // 2. XP gained
          if (rewards.xpAwarded) {
            notifications.push(() => showXpGained(rewards.xpAwarded));
          }
          
          // 3. Level up (if applicable)
          if (rewards.leveledUp) {
            notifications.push(() => showLevelUp(rewards.newLevel));
          }
          
          // 4. New achievements (if any)
          if (rewards.newAchievements && rewards.newAchievements.length > 0) {
            for (const achievementId of rewards.newAchievements) {
              notifications.push(() => showAchievementUnlock(achievementId));
            }
          }
        }
        
        // 5. Final notification: Rewards claimed with transaction link
        notifications.push(() => {
          toast({
            title: '💰 Rewards Claimed!',
            description: (
              <div className="space-y-2">
                <p className="text-sm">
                  Claimed <span className="font-bold">{session.creditsEarned.toFixed(2)} CO₂e</span> tokens!
                </p>
                <a 
                  href={`https://solscan.io/tx/${result.signature}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-500 hover:text-blue-600 underline block mt-1"
                >
                  🔗 View Memo on Solscan →
                </a>
              </div>
            ),
            duration: 8000, // Show for 8 seconds
          });
        });
        
        // Show notifications sequentially with 3.5 second delay between each
        const showNotificationsSequentially = async () => {
          for (let i = 0; i < notifications.length; i++) {
            notifications[i]();
            if (i < notifications.length - 1) {
              // Wait 3.5 seconds before showing next notification
              await new Promise(resolve => setTimeout(resolve, 3500));
            }
          }
        };
        
        // Start showing notifications
        showNotificationsSequentially();
        
        // Refresh sessions
        await loadSessions();
      } else {
        throw new Error(result.error || 'Failed to claim rewards');
      }
    } catch (error: any) {
      console.error('❌ Error claiming rewards:', error);
      toast({
        title: '❌ Claim Failed',
        description: error.message || 'Failed to claim rewards. Please try again.',
        variant: 'destructive',
        duration: 5000,
      });
    } finally {
      setMintingSession(null);
    }
  };

  // Calculate totals
  const totalSessions = sessions.length;
  const totalEnergy = sessions.reduce((sum, s) => sum + s.energyUsed, 0);
  const totalCO2eSaved = sessions.reduce((sum, s) => sum + s.co2eSaved, 0);
  const totalCredits = sessions.reduce((sum, s) => sum + s.creditsEarned, 0);

  if (!walletAddress) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Wallet Required</h3>
              <p className="text-muted-foreground">
                Please connect your wallet to view EV charging sessions
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
        <Card className="relative overflow-hidden bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-6 right-20 w-20 h-20 border-2 border-blue-600 rounded-full"></div>
            <div className="absolute top-12 right-32 w-12 h-12 border border-blue-600 rounded-full"></div>
            <div className="absolute bottom-8 right-24 w-6 h-6 bg-blue-600 rounded-full"></div>
          </div>
          
          <div className="absolute top-1/2 right-8 transform -translate-y-1/2">
            <div className="w-20 h-20 bg-blue-600 bg-opacity-20 rounded-full flex items-center justify-center backdrop-blur-sm border-2 border-blue-600 border-opacity-30">
              <Zap className="w-10 h-10 text-blue-600" />
            </div>
          </div>
          
          <CardContent className="relative z-10 py-8 px-6">
            <div className="max-w-2xl">
              <h1 className="text-3xl font-extrabold text-blue-900 dark:text-blue-100 mb-2 tracking-tight leading-tight">
                EV Charging Dashboard
              </h1>
              <PoweredByBadge className="mb-4" />
              <p className="text-lg text-blue-700 dark:text-blue-200 leading-relaxed mb-6 font-medium max-w-xl">
                Earn carbon credits for every kWh you charge. Track your impact and get rewarded for sustainable driving.
              </p>
              <div className="flex gap-6 mt-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                  <span className="text-blue-800 dark:text-blue-200 font-semibold text-xs tracking-wide">Earn Credits</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                  <span className="text-blue-800 dark:text-blue-200 font-semibold text-xs tracking-wide">Track Impact</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                  <span className="text-blue-800 dark:text-blue-200 font-semibold text-xs tracking-wide">Get Rewarded</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats - Compact */}
        <div className="grid gap-3 md:grid-cols-4">
          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">Sessions</p>
                  <p className="text-xl font-bold text-blue-900 dark:text-blue-100">{totalSessions}</p>
                </div>
                <Zap className="h-6 w-6 text-blue-600 opacity-70" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs font-medium text-green-700 dark:text-green-300 mb-1">Energy</p>
                  <p className="text-xl font-bold text-green-900 dark:text-green-100">
                    {totalEnergy.toFixed(0)} <span className="text-sm font-normal">kWh</span>
                  </p>
                </div>
                <Battery className="h-6 w-6 text-green-600 opacity-70" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 border-emerald-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300 mb-1">CO₂e Saved</p>
                  <p className="text-xl font-bold text-emerald-900 dark:text-emerald-100">
                    {totalCO2eSaved.toFixed(0)} <span className="text-sm font-normal">kg</span>
                  </p>
                </div>
                <Leaf className="h-6 w-6 text-emerald-600 opacity-70" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950 dark:to-amber-950 border-yellow-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs font-medium text-yellow-700 dark:text-yellow-300 mb-1">Credits</p>
                  <p className="text-xl font-bold text-yellow-900 dark:text-yellow-100">
                    {totalCredits.toFixed(0)} <span className="text-sm font-normal">CO₂e</span>
                  </p>
                </div>
                <Coins className="h-6 w-6 text-yellow-600 opacity-70" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions - Compact */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Quick Actions</CardTitle>
              <Button
                onClick={syncSessions}
                disabled={isSyncing}
                variant="outline"
                size="sm"
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-3 w-3 mr-1.5" />
                    Sync
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid gap-3 md:grid-cols-3">
              <Button asChild variant="outline" size="sm" className="h-auto py-3">
                <Link href="/ev-charging/live-feed">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-sm">Live Feed</span>
                  </div>
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="h-auto py-3">
                <Link href="/ev-charging/points">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    <span className="text-sm">Marketplace</span>
                  </div>
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="h-auto py-3">
                <Link href="/ev-charging/virtual-world">
                  <div className="flex items-center gap-2">
                    <Leaf className="h-4 w-4" />
                    <span className="text-sm">Virtual World</span>
                  </div>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Charging Sessions */}
        <Card>
          <CardHeader>
            <CardTitle>Your Charging Sessions</CardTitle>
            <CardDescription>
              Recent EV charging sessions and earned credits
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <Loader2 className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-spin" />
                <p className="text-muted-foreground">Loading sessions...</p>
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-12">
                <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Charging Sessions Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start charging your EV to earn carbon credits!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.map((session) => (
                  <div
                    key={session.sessionId}
                    className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
                        <Zap className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">
                          📍 {session.stationId}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatEnergy(session.energyUsed)} • {formatCO2e(session.co2eSaved)} saved
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(session.startTime, { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div className="text-right">
                        <p className="font-bold text-green-600 text-sm whitespace-nowrap">
                          +{session.creditsEarned.toFixed(2)} CO₂e
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatPoints(session.pointsEarned)}
                        </p>
                        <Badge
                          variant={session.status === 'completed' ? 'default' : 'secondary'}
                          className="mt-1 text-xs"
                        >
                          {session.status}
                        </Badge>
                      </div>
                      {session.status === 'completed' && (
                        <Button
                          onClick={() => handleMintCredits(session)}
                          disabled={mintingSession === session.sessionId}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white shadow-sm"
                        >
                          {mintingSession === session.sessionId ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                              <span className="text-xs">Claiming...</span>
                            </>
                          ) : (
                            <>
                              <Coins className="h-3.5 w-3.5 mr-1.5" />
                              <span className="text-xs font-semibold">Claim</span>
                            </>
                          )}
                        </Button>
                      )}
                    </div>
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
