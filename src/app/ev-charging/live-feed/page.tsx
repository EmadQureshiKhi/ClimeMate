'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import {
  Zap,
  Battery,
  Leaf,
  TrendingUp,
  Users,
  MapPin,
  Clock,
  Loader2,
  RefreshCw,
  Trophy,
  Activity,
  Coins,
  Sparkles,
  ArrowRight,
  Radio,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { formatEnergy, formatCO2e, type ChargingSession } from '@/lib/decharge-integration';
import Link from 'next/link';
import { icon } from 'leaflet';
import { icon } from 'leaflet';
import { icon } from 'leaflet';
import { icon } from 'leaflet';
import { icon } from 'leaflet';
import { icon } from 'leaflet';
import { icon } from 'leaflet';
import { icon } from 'leaflet';

interface LiveSession extends ChargingSession {
  isLive: boolean;
}

interface LeaderboardEntry {
  rank: number;
  userWallet: string;
  totalSessions: number;
  totalEnergy: number;
  totalCO2e: number;
  totalCredits: number;
}

interface GlobalStats {
  totalSessions: number;
  totalEnergy: number;
  totalCO2e: number;
  totalCredits: number;
  activeSessions: number;
  activeStations: number;
}

export default function LiveFeedPage() {
  const { walletAddress } = useAuth();
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [leaderboardPeriod, setLeaderboardPeriod] = useState<'today' | 'week' | 'all'>('today');

  // Fetch all data
  const fetchData = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    else setIsRefreshing(true);
    
    try {
      // Fetch in parallel
      const [sessionsRes, leaderboardRes, statsRes] = await Promise.all([
        fetch('/api/charging/live-feed?limit=50'),
        fetch(`/api/charging/leaderboard?period=${leaderboardPeriod}&limit=10`),
        fetch('/api/charging/stats?period=24h'),
      ]);

      const [sessionsData, leaderboardData, statsData] = await Promise.all([
        sessionsRes.json(),
        leaderboardRes.json(),
        statsRes.json(),
      ]);

      if (sessionsData.success) {
        setSessions(sessionsData.sessions);
      }
      
      if (leaderboardData.success) {
        setLeaderboard(leaderboardData.leaderboard);
      }
      
      if (statsData.success) {
        setStats(statsData.stats);
      }
    } catch (error) {
      console.error('Error fetching live feed data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchData();
  }, []);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData(false);
    }, 10000);

    return () => clearInterval(interval);
  }, [leaderboardPeriod]);

  // Refresh when leaderboard period changes
  useEffect(() => {
    fetchData(false);
  }, [leaderboardPeriod]);

  const activeSessions = sessions.filter(s => s.status === 'active');
  const recentSessions = sessions.filter(s => s.status === 'completed').slice(0, 20);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <Loader2 className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-spin" />
          <p className="text-muted-foreground">Loading live feed...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/30 dark:from-slate-950 dark:via-blue-950/30 dark:to-cyan-950/30">
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Hero Header */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 p-8 md:p-12 shadow-2xl">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
            <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-teal-500/20 blur-3xl"></div>
            
            <div className="relative z-10">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="relative">
                      <Radio className="h-10 w-10 text-white" />
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    </div>
                    <div>
                      <h1 className="text-4xl md:text-5xl font-bold text-white">
                        Live Charging Feed
                      </h1>
                      <p className="text-blue-100 mt-1 text-lg">
                        Real-time EV charging activity across the network
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-white/90 text-sm">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span>Updates every 10 seconds</span>
                  </div>
                </div>
                <Button
                  onClick={() => fetchData(false)}
                  disabled={isRefreshing}
                  size="lg"
                  className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border-white/30"
                >
                  {isRefreshing ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Refreshing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-5 w-5 mr-2" />
                      Refresh Now
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Global Stats - Enhanced */}
          {stats && (
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
              <Card className="relative overflow-hidden border-blue-200 dark:border-blue-800 hover:shadow-lg transition-all duration-300 group">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 group-hover:from-blue-500/20 group-hover:to-cyan-500/20 transition-all"></div>
                <CardContent className="relative pt-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg group-hover:scale-110 transition-transform">
                      <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="font-semibold text-sm text-muted-foreground">Total Sessions</h3>
                  </div>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                    {stats.totalSessions.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">Last 24 hours</p>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-yellow-200 dark:border-yellow-800 hover:shadow-lg transition-all duration-300 group">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 group-hover:from-yellow-500/20 group-hover:to-orange-500/20 transition-all"></div>
                <CardContent className="relative pt-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg group-hover:scale-110 transition-transform">
                      <Zap className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <h3 className="font-semibold text-sm text-muted-foreground">Energy Used</h3>
                  </div>
                  <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mb-1">
                    {stats.totalEnergy.toFixed(0)}
                  </p>
                  <p className="text-xs text-muted-foreground">kWh delivered</p>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-green-200 dark:border-green-800 hover:shadow-lg transition-all duration-300 group">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10 group-hover:from-green-500/20 group-hover:to-emerald-500/20 transition-all"></div>
                <CardContent className="relative pt-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg group-hover:scale-110 transition-transform">
                      <Leaf className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="font-semibold text-sm text-muted-foreground">CO₂e Saved</h3>
                  </div>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">
                    {stats.totalCO2e.toFixed(0)}
                  </p>
                  <p className="text-xs text-muted-foreground">kg carbon offset</p>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-purple-200 dark:border-purple-800 hover:shadow-lg transition-all duration-300 group">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 group-hover:from-purple-500/20 group-hover:to-pink-500/20 transition-all"></div>
                <CardContent className="relative pt-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg group-hover:scale-110 transition-transform">
                      <Coins className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h3 className="font-semibold text-sm text-muted-foreground">Credits Earned</h3>
                  </div>
                  <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                    {stats.totalCredits.toFixed(0)}
                  </p>
                  <p className="text-xs text-muted-foreground">CO₂e tokens</p>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-red-200 dark:border-red-800 hover:shadow-lg transition-all duration-300 group">
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-rose-500/10 group-hover:from-red-500/20 group-hover:to-rose-500/20 transition-all"></div>
                <CardContent className="relative pt-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-lg group-hover:scale-110 transition-transform">
                      <Radio className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </div>
                    <h3 className="font-semibold text-sm text-muted-foreground">Active Now</h3>
                  </div>
                  <p className="text-3xl font-bold text-red-600 dark:text-red-400 mb-1 animate-pulse">
                    {stats.activeSessions}
                  </p>
                  <p className="text-xs text-muted-foreground">charging sessions</p>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-cyan-200 dark:border-cyan-800 hover:shadow-lg transition-all duration-300 group">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-teal-500/10 group-hover:from-cyan-500/20 group-hover:to-teal-500/20 transition-all"></div>
                <CardContent className="relative pt-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-cyan-100 dark:bg-cyan-900/50 rounded-lg group-hover:scale-110 transition-transform">
                      <MapPin className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                    </div>
                    <h3 className="font-semibold text-sm text-muted-foreground">Stations</h3>
                  </div>
                  <p className="text-3xl font-bold text-cyan-600 dark:text-cyan-400 mb-1">
                    {stats.activeStations}
                  </p>
                  <p className="text-xs text-muted-foreground">in network</p>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Live Sessions */}
            <div className="lg:col-span-2 space-y-6">
              {/* Active Sessions */}
              {activeSessions.length > 0 && (
                <Card className="border-green-200 dark:border-green-800 shadow-lg">
                  <CardHeader className="pb-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl flex items-center gap-3">
                        <div className="relative">
                          <Radio className="h-6 w-6 text-green-600" />
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                        </div>
                        <span>Active Charging Sessions</span>
                      </CardTitle>
                      <Badge className="bg-green-600 hover:bg-green-700 animate-pulse">
                        {activeSessions.length} Live
                      </Badge>
                    </div>
                    <CardDescription>
                      Real-time charging happening right now
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      {activeSessions.map((session, index) => (
                        <div
                          key={session.sessionId}
                          className="animate-in fade-in slide-in-from-top-4"
                          style={{ animationDelay: `${index * 100}ms` }}
                        >
                          <SessionCard session={session} isActive />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recent Sessions */}
              <Card className="shadow-lg">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl flex items-center gap-3">
                      <Clock className="h-6 w-6 text-blue-600" />
                      <span>Recent Activity</span>
                    </CardTitle>
                    <Badge variant="secondary">
                      {recentSessions.length} Sessions
                    </Badge>
                  </div>
                  <CardDescription>
                    Latest completed charging sessions
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {recentSessions.length > 0 ? (
                      recentSessions.map((session, index) => (
                        <div
                          key={session.sessionId}
                          className="animate-in fade-in slide-in-from-bottom-4"
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <SessionCard session={session} />
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12">
                        <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                        <p className="text-muted-foreground">No recent sessions</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Check back soon for new activity
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Leaderboard */}
            <div>
              <Card className="sticky top-4 shadow-lg border-yellow-200 dark:border-yellow-800">
                <CardHeader className="pb-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/50 dark:to-orange-950/50">
                  <CardTitle className="text-xl flex items-center gap-3">
                    <Trophy className="h-6 w-6 text-yellow-600" />
                    <span>Top Chargers</span>
                  </CardTitle>
                  <CardDescription className="mt-2">
                    Leading contributors to clean energy
                  </CardDescription>
                  <div className="flex gap-2 mt-4">
                    <Button
                      size="sm"
                      variant={leaderboardPeriod === 'today' ? 'default' : 'outline'}
                      onClick={() => setLeaderboardPeriod('today')}
                      className="flex-1 text-xs"
                    >
                      Today
                    </Button>
                    <Button
                      size="sm"
                      variant={leaderboardPeriod === 'week' ? 'default' : 'outline'}
                      onClick={() => setLeaderboardPeriod('week')}
                      className="flex-1 text-xs"
                    >
                      Week
                    </Button>
                    <Button
                      size="sm"
                      variant={leaderboardPeriod === 'all' ? 'default' : 'outline'}
                      onClick={() => setLeaderboardPeriod('all')}
                      className="flex-1 text-xs"
                    >
                      All Time
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    {leaderboard.map((entry, index) => (
                      <div
                        key={entry.userWallet}
                        className="animate-in fade-in slide-in-from-right-4"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <LeaderboardCard
                          entry={entry}
                          isCurrentUser={entry.userWallet === walletAddress}
                        />
                      </div>
                    ))}
                    {leaderboard.length === 0 && (
                      <div className="text-center py-12">
                        <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                        <p className="text-muted-foreground">No rankings yet</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Be the first to charge!
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Back Button */}
          <div className="flex justify-center pt-8">
            <Button 
              asChild 
              size="lg"
              variant="outline"
              className="group hover:border-blue-300 dark:hover:border-blue-700"
            >
              <Link href="/ev-charging" className="flex items-center gap-2">
                <ArrowRight className="h-4 w-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
                Back to Dashboard
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Session Card Component - Enhanced
function SessionCard({ session, isActive = false }: { session: LiveSession; isActive?: boolean }) {
  return (
    <div className={`group relative overflow-hidden rounded-xl border p-4 transition-all duration-300 hover:shadow-lg ${
      isActive 
        ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 border-green-300 dark:border-green-700 hover:border-green-400' 
        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700'
    }`}>
      {isActive && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl"></div>
      )}
      
      <div className="relative flex items-start gap-4">
        {/* Icon */}
        <div className={`relative w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 ${
          isActive 
            ? 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/50' 
            : 'bg-gradient-to-br from-blue-500 to-cyan-600 shadow-lg shadow-blue-500/50'
        }`}>
          <Zap className="h-6 w-6 text-white" />
          {isActive && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse border-2 border-white"></div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <p className="font-bold text-sm truncate">
              {session.userWallet.slice(0, 6)}...{session.userWallet.slice(-6)}
            </p>
            {isActive && (
              <Badge className="text-xs bg-red-500 hover:bg-red-600 animate-pulse">
                <Radio className="h-3 w-3 mr-1" />
                LIVE
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="h-3 w-3 text-muted-foreground" />
            <p className="text-xs text-muted-foreground font-medium">
              {session.stationId}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-3">
            <div className="flex items-center gap-1.5">
              <Battery className="h-3.5 w-3.5 text-yellow-600" />
              <span className="text-xs font-medium">{formatEnergy(session.energyUsed)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Leaf className="h-3.5 w-3.5 text-green-600" />
              <span className="text-xs font-medium">{formatCO2e(session.co2eSaved)}</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="text-right flex-shrink-0">
          <div className="flex items-center gap-1 justify-end mb-1">
            <Sparkles className="h-3.5 w-3.5 text-purple-600" />
            <p className="text-lg font-bold text-purple-600">
              +{session.creditsEarned.toFixed(1)}
            </p>
          </div>
          <p className="text-xs text-muted-foreground mb-1">CO₂e tokens</p>
          <div className="flex items-center gap-1 justify-end">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(session.startTime), { addSuffix: true })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Leaderboard Card Component - Enhanced
function LeaderboardCard({ entry, isCurrentUser }: { entry: LeaderboardEntry; isCurrentUser: boolean }) {
  const getRankDisplay = (rank: number) => {
    if (rank === 1) return { icon: Trophy, color: 'text-yellow-500', bg: 'bg-yellow-100 dark:bg-yellow-900/50', border: 'border-yellow-300' };
    if (rank === 2) return { icon: Trophy, color: 'text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800', border: 'border-slate-300' };
    if (rank === 3) return { icon: Trophy, color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/50', border: 'border-orange-300' };
    return { icon: Users, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/50', border: 'border-blue-300' };
  };

  const rankDisplay = getRankDisplay(entry.rank);
  const RankIcon = rankDisplay.icon;

  return (
    <div className={`group relative overflow-hidden rounded-xl border p-4 transition-all duration-300 hover:shadow-lg ${
      isCurrentUser 
        ? 'bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/50 dark:to-cyan-950/50 border-blue-300 dark:border-blue-700' 
        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
    }`}>
      {isCurrentUser && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"></div>
      )}
      
      <div className="relative flex items-center gap-3">
        {/* Rank Badge */}
        <div className={`relative w-12 h-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0 ${rankDisplay.bg} ${rankDisplay.border} border-2 transition-transform group-hover:scale-110`}>
          {entry.rank <= 3 ? (
            <RankIcon className={`h-6 w-6 ${rankDisplay.color}`} />
          ) : (
            <>
              <span className="text-xs font-bold text-muted-foreground">#</span>
              <span className="text-lg font-bold text-muted-foreground leading-none">{entry.rank}</span>
            </>
          )}
        </div>

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-bold text-sm truncate">
              {entry.userWallet.slice(0, 6)}...{entry.userWallet.slice(-6)}
            </p>
            {isCurrentUser && (
              <Badge variant="secondary" className="text-xs">
                You
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Activity className="h-3 w-3" />
              {entry.totalSessions}
            </span>
            <span className="flex items-center gap-1">
              <Zap className="h-3 w-3" />
              {entry.totalEnergy.toFixed(0)} kWh
            </span>
          </div>
        </div>

        {/* CO2e Stats */}
        <div className="text-right flex-shrink-0">
          <div className="flex items-center gap-1 justify-end mb-1">
            <Leaf className="h-4 w-4 text-green-600" />
            <p className="text-lg font-bold text-green-600">
              {entry.totalCO2e.toFixed(0)}
            </p>
          </div>
          <p className="text-xs text-muted-foreground">kg CO₂e</p>
        </div>
      </div>
    </div>
  );
}
