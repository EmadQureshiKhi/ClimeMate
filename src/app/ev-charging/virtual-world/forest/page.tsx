'use client';

import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Sky } from '@react-three/drei';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useVirtualProfile } from '@/hooks/useVirtualProfile';
import { Forest3D } from '@/components/virtual-world/Forest3D';
import {
  Loader2,
  Trees,
  ArrowRight,
  Leaf,
  Sprout,
  TreeDeciduous,
  TreePine,
} from 'lucide-react';
import Link from 'next/link';
import { getForestLevelName, forestLevelNames } from '@/data/achievements-catalog';
import { calculateForestStats } from '@/lib/virtual-world';

export default function ForestPage() {
  const { walletAddress } = useAuth();
  const { profile, isLoading } = useVirtualProfile();

  if (!walletAddress) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Trees className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Wallet Required</h3>
              <p className="text-muted-foreground">
                Please connect your wallet to view your forest
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
          <p className="text-muted-foreground">Loading your forest...</p>
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
              <Trees className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Profile Not Found</h3>
              <p className="text-muted-foreground">
                Unable to load your forest
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const forestStats = calculateForestStats(profile.treesPlanted);
  const forestLevelName = getForestLevelName(forestStats.forestLevel);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50/30 to-teal-50/30 dark:from-green-950 dark:via-emerald-950/30 dark:to-teal-950/30">
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
                    Your Impact Forest
                  </h1>
                  <p className="text-green-100 mt-1 text-lg">
                    Every tree represents 1 kg of CO₂e saved
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Forest Stats */}
          <div className="grid gap-6 md:grid-cols-4">
            <Card className="relative overflow-hidden border-green-200 dark:border-green-800">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10"></div>
              <CardContent className="relative pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                    <Trees className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="font-semibold text-sm text-muted-foreground">Trees Planted</h3>
                </div>
                <p className="text-4xl font-bold text-green-600 dark:text-green-400">
                  {profile.treesPlanted.toLocaleString()}
                </p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-emerald-200 dark:border-emerald-800">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-teal-500/10"></div>
              <CardContent className="relative pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg">
                    <Leaf className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h3 className="font-semibold text-sm text-muted-foreground">CO₂e Saved</h3>
                </div>
                <p className="text-4xl font-bold text-emerald-600 dark:text-emerald-400">
                  {forestStats.co2eSaved}
                </p>
                <p className="text-xs text-muted-foreground mt-1">kg</p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-teal-200 dark:border-teal-800">
              <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-cyan-500/10"></div>
              <CardContent className="relative pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-teal-100 dark:bg-teal-900/50 rounded-lg">
                    <TreeDeciduous className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                  </div>
                  <h3 className="font-semibold text-sm text-muted-foreground">Forest Level</h3>
                </div>
                <p className="text-2xl font-bold text-teal-600 dark:text-teal-400 mb-1">
                  Level {forestStats.forestLevel}
                </p>
                <Badge variant="outline" className="text-xs">
                  {forestLevelName}
                </Badge>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-cyan-200 dark:border-cyan-800">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-500/10"></div>
              <CardContent className="relative pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-cyan-100 dark:bg-cyan-900/50 rounded-lg">
                    <Sprout className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <h3 className="font-semibold text-sm text-muted-foreground">Next Level</h3>
                </div>
                {forestStats.forestLevel < 5 ? (
                  <>
                    <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400 mb-2">
                      {forestStats.nextLevelTrees - profile.treesPlanted}
                    </p>
                    <p className="text-xs text-muted-foreground">trees needed</p>
                  </>
                ) : (
                  <p className="text-lg font-bold text-cyan-600 dark:text-cyan-400">
                    Max Level! 🎉
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Progress to Next Level */}
          {forestStats.forestLevel < 5 && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Progress to Next Level</h2>
                  <Badge variant="secondary">
                    {forestStats.progress}%
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 transition-all duration-500"
                      style={{ width: `${forestStats.progress}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{forestLevelName}</span>
                    <span>{forestLevelNames[forestStats.forestLevel] || 'Max Level'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 3D Forest Visualization */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-2xl font-bold mb-6">Your 3D Forest</h2>
              
              {profile.treesPlanted === 0 ? (
                <div className="text-center py-12">
                  <Sprout className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Trees Yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Start charging your EV to plant your first tree!
                  </p>
                  <Button asChild>
                    <Link href="/ev-charging">
                      Start Charging
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              ) : (
                <>
                  <div className="relative w-full h-[600px] rounded-xl overflow-hidden bg-gradient-to-b from-sky-200 to-green-100 dark:from-sky-900 dark:to-green-950">
                    <Canvas
                      camera={{ position: [20, 15, 20], fov: 50 }}
                      shadows
                    >
                      <Suspense fallback={null}>
                        {/* Lighting */}
                        <ambientLight intensity={0.5} />
                        <directionalLight
                          position={[10, 20, 10]}
                          intensity={1}
                          castShadow
                          shadow-mapSize-width={2048}
                          shadow-mapSize-height={2048}
                        />

                        {/* Sky */}
                        <Sky
                          distance={450000}
                          sunPosition={[10, 20, 10]}
                          inclination={0.6}
                          azimuth={0.25}
                        />

                        {/* Ground */}
                        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
                          <planeGeometry args={[100, 100]} />
                          <meshStandardMaterial color="#4a7c59" />
                        </mesh>

                        {/* Forest */}
                        <Forest3D treeCount={profile.treesPlanted} radius={15} />

                        {/* Environment */}
                        <Environment preset="forest" />

                        {/* Controls */}
                        <OrbitControls
                          enablePan={true}
                          enableZoom={true}
                          enableRotate={true}
                          minDistance={10}
                          maxDistance={50}
                          maxPolarAngle={Math.PI / 2.2}
                        />
                      </Suspense>
                    </Canvas>

                    {/* Controls Info Overlay */}
                    <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm">
                      <p className="font-medium mb-1">🖱️ Controls:</p>
                      <p className="text-xs">• Left click + drag to rotate</p>
                      <p className="text-xs">• Right click + drag to pan</p>
                      <p className="text-xs">• Scroll to zoom</p>
                    </div>

                    {/* Tree Count Overlay */}
                    <div className="absolute top-4 right-4 bg-green-600/90 backdrop-blur-sm text-white px-4 py-2 rounded-lg">
                      <p className="text-sm font-medium">
                        🌳 {profile.treesPlanted.toLocaleString()} {profile.treesPlanted === 1 ? 'Tree' : 'Trees'}
                      </p>
                      {profile.treesPlanted > 100 && (
                        <p className="text-xs opacity-90 mt-1">
                          Showing 100 trees for performance
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 text-center text-sm text-muted-foreground">
                    <p>Each tree represents 1 kg of CO₂e saved through EV charging 🌍</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Forest Level Info */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-2xl font-bold mb-6">Forest Levels</h2>
              <div className="grid gap-4 md:grid-cols-5">
                {forestLevelNames.map((name, index) => {
                  const level = index + 1;
                  const isUnlocked = forestStats.forestLevel >= level;
                  const isCurrent = forestStats.forestLevel === level;

                  return (
                    <div
                      key={level}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        isCurrent
                          ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                          : isUnlocked
                          ? 'border-green-300 dark:border-green-800'
                          : 'border-slate-200 dark:border-slate-800 opacity-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Trees className={`h-5 w-5 ${isUnlocked ? 'text-green-600 dark:text-green-400' : 'text-slate-400'}`} />
                        <span className="font-bold">Level {level}</span>
                      </div>
                      <p className="text-sm font-medium mb-1">{name}</p>
                      <p className="text-xs text-muted-foreground">
                        {level === 1 && '0-49 trees'}
                        {level === 2 && '50-99 trees'}
                        {level === 3 && '100-249 trees'}
                        {level === 4 && '250-499 trees'}
                        {level === 5 && '500+ trees'}
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Back Button */}
          <div className="flex justify-center pt-8">
            <Button 
              asChild 
              variant="outline" 
              size="lg"
              className="group hover:border-green-300 dark:hover:border-green-700"
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
