'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useAchievements } from '@/hooks/useAchievements';
import {
  Loader2,
  Trophy,
  ArrowRight,
  Lock,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';
import { achievementIcons, achievementsByCategory } from '@/data/achievements-catalog';

export default function AchievementsPage() {
  const { walletAddress } = useAuth();
  const { achievements, completedCount, totalCount, completionRate, isLoading } = useAchievements();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  if (!walletAddress) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Wallet Required</h3>
              <p className="text-muted-foreground">
                Please connect your wallet to view achievements
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <Loader2 className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-spin" />
          <p className="text-muted-foreground">Loading achievements...</p>
        </div>
      </div>
    );
  }

  const filteredAchievements = selectedCategory === 'all' 
    ? achievements 
    : achievements.filter(a => a.achievement.category === selectedCategory);

  const categoryColors: Record<string, string> = {
    charging: 'from-blue-500 to-cyan-500',
    environmental: 'from-green-500 to-emerald-500',
    social: 'from-purple-500 to-pink-500',
    gaming: 'from-orange-500 to-red-500',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-yellow-50/30 to-orange-50/30 dark:from-slate-950 dark:via-yellow-950/30 dark:to-orange-950/30">
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-yellow-600 via-orange-600 to-red-600 p-8 md:p-12 shadow-2xl">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <Trophy className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl md:text-5xl font-bold text-white">
                    Achievements
                  </h1>
                  <p className="text-yellow-100 mt-1 text-lg">
                    Track your progress and unlock rewards
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Overview */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Your Progress</h2>
                <Badge variant="secondary" className="text-lg px-4 py-2">
                  {completedCount}/{totalCount}
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 transition-all duration-500"
                    style={{ width: `${completionRate}%` }}
                  ></div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {completionRate}% complete • {totalCount - completedCount} remaining
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Category Tabs */}
          <Tabs defaultValue="all" onValueChange={setSelectedCategory}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="charging">Charging</TabsTrigger>
              <TabsTrigger value="environmental">Environmental</TabsTrigger>
              <TabsTrigger value="social">Social</TabsTrigger>
              <TabsTrigger value="gaming">Gaming</TabsTrigger>
            </TabsList>

            <TabsContent value={selectedCategory} className="mt-6">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredAchievements.map((userAchievement) => {
                  const Icon = achievementIcons[userAchievement.achievement.icon];
                  const categoryColor = categoryColors[userAchievement.achievement.category];
                  const progressPercent = Math.min(
                    (userAchievement.progress / userAchievement.achievement.requirementValue) * 100,
                    100
                  );

                  return (
                    <Card 
                      key={userAchievement.id}
                      className={`relative overflow-hidden transition-all duration-300 ${
                        userAchievement.completed 
                          ? 'border-yellow-300 dark:border-yellow-700 shadow-lg' 
                          : 'hover:shadow-md'
                      }`}
                    >
                      {userAchievement.completed && (
                        <div className="absolute top-4 right-4">
                          <CheckCircle2 className="h-6 w-6 text-yellow-500" />
                        </div>
                      )}

                      <CardContent className="pt-6">
                        <div className="flex items-start gap-4 mb-4">
                          <div className={`p-3 rounded-xl bg-gradient-to-br ${categoryColor} text-white shadow-lg ${
                            !userAchievement.completed && 'opacity-50'
                          }`}>
                            {Icon ? <Icon className="h-6 w-6" /> : <Trophy className="h-6 w-6" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-lg mb-1">
                              {userAchievement.achievement.name}
                            </h3>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {userAchievement.achievement.description}
                            </p>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        {!userAchievement.completed && (
                          <div className="space-y-2 mb-4">
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>{userAchievement.progress}</span>
                              <span>{userAchievement.achievement.requirementValue}</span>
                            </div>
                            <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div 
                                className={`h-full bg-gradient-to-r ${categoryColor} transition-all duration-500`}
                                style={{ width: `${progressPercent}%` }}
                              ></div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {Math.round(progressPercent)}% complete
                            </p>
                          </div>
                        )}

                        {/* Rewards */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="secondary" className="text-xs">
                            <Trophy className="h-3 w-3 mr-1" />
                            {userAchievement.achievement.rewardXp} XP
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {userAchievement.achievement.rewardPoints} points
                          </Badge>
                          <Badge 
                            variant="outline" 
                            className={`text-xs capitalize ${
                              categoryColor.includes('blue') ? 'border-blue-300 text-blue-600' :
                              categoryColor.includes('green') ? 'border-green-300 text-green-600' :
                              categoryColor.includes('purple') ? 'border-purple-300 text-purple-600' :
                              'border-orange-300 text-orange-600'
                            }`}
                          >
                            {userAchievement.achievement.category}
                          </Badge>
                        </div>

                        {userAchievement.completed && userAchievement.completedAt && (
                          <p className="text-xs text-muted-foreground mt-3">
                            Completed {new Date(userAchievement.completedAt).toLocaleDateString()}
                          </p>
                        )}

                        {!userAchievement.completed && userAchievement.progress === 0 && (
                          <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                            <Lock className="h-3 w-3" />
                            <span>Not started</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>

          {/* Back Button */}
          <div className="flex justify-center pt-8">
            <Button 
              asChild 
              variant="outline" 
              size="lg"
              className="group hover:border-yellow-300 dark:hover:border-yellow-700"
            >
              <Link href="/ev-charging/virtual-world" className="flex items-center gap-2">
                <ArrowRight className="h-4 w-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
                Back to Virtual World
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
