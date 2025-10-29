'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useVirtualProfile } from '@/hooks/useVirtualProfile';
import { useAchievements } from '@/hooks/useAchievements';
import {
  Loader2,
  Trophy,
  Zap,
  Trees,
  Star,
  ArrowRight,
  Sparkles,
  Award,
  TrendingUp,
  Target,
} from 'lucide-react';
import Link from 'next/link';
import { calculateLevel, getXpForNextLevel, getForestLevelName } from '@/data/achievements-catalog';
import { getLevelProgress, calculateForestStats } from '@/lib/virtual-world';

export default function VirtualWorldPage() {
  const { walletAddress } = useAuth();
  const { profile, isLoading: profileLoading } = useVirtualProfile();
  const { achievements, completedCount, totalCount, completionRate, isLoading: achievementsLoading } = useAchievements();

  if (!walletAddress) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Wallet Required</h3>
              <p className="text-muted-foreground">
                Please connect your wallet to access the Virtual World
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (profileLoading || achievementsLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <Loader2 className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-spin" />
          <p className="text-muted-foreground">Loading your virtual world...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Profile Not Found</h3>
              <p className="text-muted-foreground">
                Unable to load your virtual profile
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const levelProgress = getLevelProgress(profile.experiencePoints);
  const xpForNextLevel = getXpForNextLevel(profile.level);
  const currentLevelXp = Math.pow(profile.level - 1, 2) * 50;
  const xpInCurrentLevel = profile.experiencePoints - currentLevelXp;
  const xpNeededForLevel = xpForNextLevel - currentLevelXp;
  const forestStats = calculateForestStats(profile.treesPlanted);

  const recentAchievements = achievements
    .filter(a => a.completed)
    .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50/30 to-blue-50/30 dark:from-slate-950 dark:via-green-950/30 dark:to-blue-950/30">
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Hero Header */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 p-8 md:p-12 shadow-2xl">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
            <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-teal-500/20 blur-3xl"></div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <Trees className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl md:text-5xl font-bold text-white">
                    Virtual World
                  </h1>
                  <p className="text-green-100 mt-1 text-lg">
                    Your gamified EV charging journey
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* Level Card */}
            <Card className="relative overflow-hidden border-purple-200 dark:border-purple-800">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10"></div>
              <CardContent className="relative pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                    <Star className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="font-semibold text-sm text-muted-foreground">Level</h3>
                </div>
                <p className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                  {profile.level}
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{xpInCurrentLevel} XP</span>
                    <span>{xpNeededForLevel} XP</span>
                  </div>
                  <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                      style={{ width: `${levelProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {levelProgress}% to Level {profile.level + 1}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Forest Card */}
            <Card className="relative overflow-hidden border-green-200 dark:border-green-800">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10"></div>
              <CardContent className="relative pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                    <Trees className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="font-semibold text-sm text-muted-foreground">Forest</h3>
                </div>
                <p className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2">
                  {profile.treesPlanted}
                </p>
                <div className="space-y-1">
                  <Badge variant="outline" className="text-xs">
                    {getForestLevelName(forestStats.forestLevel)}
                  </Badge>
                  <p className="text-xs text-muted-foreground">
                    {forestStats.co2eSaved} kg CO₂e saved
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Achievements Card */}
            <Card className="relative overflow-hidden border-orange-200 dark:border-orange-800">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-red-500/10"></div>
              <CardContent className="relative pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/50 rounded-lg">
                    <Trophy className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <h3 className="font-semibold text-sm text-muted-foreground">Achievements</h3>
                </div>
                <p className="text-4xl font-bold text-orange-600 dark:text-orange-400 mb-2">
                  {completedCount}/{totalCount}
                </p>
                <div className="space-y-2">
                  <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-500"
                      style={{ width: `${completionRate}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {completionRate}% complete
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* XP Card */}
            <Card className="relative overflow-hidden border-blue-200 dark:border-blue-800">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10"></div>
              <CardContent className="relative pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                    <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="font-semibold text-sm text-muted-foreground">Total XP</h3>
                </div>
                <p className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                  {profile.experiencePoints.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  Experience Points
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Achievements */}
          {recentAchievements.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg">
                      <Award className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <h2 className="text-xl font-bold">Recent Achievements</h2>
                  </div>
                  <Button asChild variant="ghost" size="sm">
                    <Link href="/ev-charging/virtual-world/achievements">
                      View All
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  {recentAchievements.map((userAchievement) => (
                    <div
                      key={userAchievement.id}
                      className="p-4 rounded-lg border bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 border-yellow-200 dark:border-yellow-800"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-yellow-500 text-white rounded-lg">
                          <Trophy className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm mb-1">
                            {userAchievement.achievement.name}
                          </h4>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {userAchievement.achievement.description}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="secondary" className="text-xs">
                              +{userAchievement.achievement.rewardXp} XP
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              +{userAchievement.achievement.rewardPoints} pts
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-purple-200 dark:border-purple-800 hover:border-purple-400 dark:hover:border-purple-600">
              <CardContent className="pt-6">
                <Link href="/ev-charging/virtual-world/achievements" className="block">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-xl group-hover:scale-110 transition-transform">
                      <Target className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">View Achievements</h3>
                      <p className="text-sm text-muted-foreground">
                        Track your progress
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center text-sm text-purple-600 dark:text-purple-400 font-medium">
                    Explore
                    <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-green-200 dark:border-green-800 hover:border-green-400 dark:hover:border-green-600">
              <CardContent className="pt-6">
                <Link href="/ev-charging/virtual-world/forest" className="block">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 text-white rounded-xl group-hover:scale-110 transition-transform">
                      <Trees className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Your Forest</h3>
                      <p className="text-sm text-muted-foreground">
                        See your impact grow
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center text-sm text-green-600 dark:text-green-400 font-medium">
                    Visit Forest
                    <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-cyan-200 dark:border-cyan-800 hover:border-cyan-400 dark:hover:border-cyan-600">
              <CardContent className="pt-6">
                <Link href="/ev-charging/virtual-world/map-3d" className="block">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-500 text-white rounded-xl group-hover:scale-110 transition-transform">
                      <Sparkles className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">ChargeMap 🗺️</h3>
                      <p className="text-sm text-muted-foreground">
                        Own land & earn
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center text-sm text-cyan-600 dark:text-cyan-400 font-medium">
                      Enter ChargeMap
                      <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </div>
                    <span className="text-xs font-semibold text-orange-600 dark:text-orange-400">NEW! Virtual Land Ownership</span>
                  </div>
                </Link>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600">
              <CardContent className="pt-6">
                <Link href="/ev-charging" className="block">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 text-white rounded-xl group-hover:scale-110 transition-transform">
                      <TrendingUp className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Charge & Earn</h3>
                      <p className="text-sm text-muted-foreground">
                        Gain XP and plant trees
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center text-sm text-blue-600 dark:text-blue-400 font-medium">
                    Start Charging
                    <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Back Button */}
          <div className="flex justify-center pt-8">
            <Button 
              asChild 
              variant="outline" 
              size="lg"
              className="group hover:border-green-300 dark:hover:border-green-700"
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
