'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useVirtualProfile } from '@/hooks/useVirtualProfile';
import { useVirtualPlots } from '@/hooks/useVirtualPlots';
import {
  Loader2,
  ArrowRight,
  Info,
  MapPin,
  Zap,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import stationsData from '@/data/decharge-stations.json';
import { latLngToCell } from 'h3-js';

// Dynamically import map components (client-side only)
const WorldMap = dynamic(
  () => import('@/components/virtual-world/WorldMap').then(mod => mod.WorldMap),
  { ssr: false, loading: () => <MapLoader /> }
);

const HexagonLayer = dynamic(
  () => import('@/components/virtual-world/HexagonLayer').then(mod => mod.HexagonLayer),
  { ssr: false }
);

const StationMarkers = dynamic(
  () => import('@/components/virtual-world/StationMarkers').then(mod => mod.StationMarkers),
  { ssr: false }
);

function MapLoader() {
  return (
    <div className="w-full h-[600px] rounded-xl border border-slate-200 dark:border-slate-800 bg-gradient-to-b from-blue-900 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-12 w-12 text-blue-400 mx-auto mb-4 animate-spin" />
        <p className="text-white">Loading World Map...</p>
      </div>
    </div>
  );
}

export default function Map3DPage() {
  const { walletAddress } = useAuth();
  const { profile, isLoading } = useVirtualProfile();
  const { ownedPlots, buyPlot, installCharger } = useVirtualPlots();
  const [selectedHex, setSelectedHex] = useState<{
    h3Index: string;
    lat: number;
    lng: number;
  } | null>(null);
  const [selectedStation, setSelectedStation] = useState<any | null>(null);
  const [showInfo, setShowInfo] = useState(true);
  const [buying, setBuying] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [showChargerModal, setShowChargerModal] = useState(false);
  const [selectedPlotForCharger, setSelectedPlotForCharger] = useState<any | null>(null);

  // Get stations array from JSON
  const stations = stationsData.charge_points || [];

  // Create sets for hexagon coloring - use useMemo to recalculate when ownedPlots changes
  const ownedHexes = React.useMemo(() => {
    const hexes = new Set(ownedPlots.map(p => p.h3Index));
    console.log('ownedHexes recalculated:', hexes.size, 'hexes', Array.from(hexes));
    return hexes;
  }, [ownedPlots]);

  const availableHexes = new Set<string>();
  
  const premiumHexes = React.useMemo(() => {
    const hexes = new Set<string>();
    stations.forEach((station: any) => {
      try {
        const h3Index = latLngToCell(
          station.location.latitude,
          station.location.longitude,
          8
        );
        hexes.add(h3Index);
      } catch (error) {
        // Skip invalid coordinates
      }
    });
    return hexes;
  }, [stations]);

  // Debug: Log when ownedPlots changes
  useEffect(() => {
    console.log('ownedPlots updated:', ownedPlots.length, 'plots');
  }, [ownedPlots]);

  const handleHexClick = async (h3Index: string, lat: number, lng: number) => {
    console.log('Hex clicked:', h3Index, lat, lng);
    setSelectedHex({ h3Index, lat, lng });
    setSelectedStation(null);
    
    // Fetch plot info
    try {
      const response = await fetch(`/api/virtual-world/plots/info?h3Index=${h3Index}`);
      const data = await response.json();
      console.log('Plot info:', data);
    } catch (error) {
      console.error('Error fetching plot info:', error);
    }
  };

  const handleInstallCharger = async (level: number) => {
    if (!selectedPlotForCharger) return;

    setInstalling(true);
    try {
      // TODO: Create and send Solana transaction here
      const success = await installCharger(selectedPlotForCharger.id, level);
      
      if (success) {
        alert(`Level ${level} charger installed successfully!`);
        setShowChargerModal(false);
        setSelectedPlotForCharger(null);
      }
    } catch (error) {
      console.error('Error installing charger:', error);
      alert('Failed to install charger');
    } finally {
      setInstalling(false);
    }
  };

  const handleStationClick = (station: any) => {
    setSelectedStation(station);
    setSelectedHex(null);
  };

  const handleBuyPlot = async () => {
    if (!selectedHex || !walletAddress) return;

    setBuying(true);
    try {
      const isPremium = premiumHexes.has(selectedHex.h3Index);
      const price = isPremium ? 0.1 : 0.01;

      // TODO: Create and send Solana transaction here
      // For now, just database tracking
      const success = await buyPlot(selectedHex.h3Index, price);
      
      if (success) {
        alert('Plot purchased successfully! The hex should turn purple now.');
        setSelectedHex(null);
        // The ownedPlots state is automatically updated by the buyPlot function
        // which calls refetch, and useMemo will recalculate ownedHexes
      }
    } catch (error) {
      console.error('Error buying plot:', error);
      alert('Failed to buy plot');
    } finally {
      setBuying(false);
    }
  };

  if (!walletAddress) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Loader2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Wallet Required</h3>
              <p className="text-muted-foreground">
                Please connect your wallet to view the world map
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
        <MapLoader />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 dark:from-slate-950 dark:via-blue-950/30 dark:to-purple-950/30">
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">ChargeMap - Virtual Land Ownership</h1>
              <p className="text-muted-foreground">
                Own plots, install chargers, and earn from EV charging activity
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowInfo(!showInfo)}
            >
              <Info className="h-4 w-4 mr-2" />
              {showInfo ? 'Hide' : 'Show'} Info
            </Button>
          </div>

          {/* Info Banner */}
          {showInfo && (
            <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
              <CardContent className="pt-6">
                <div className="mb-4 p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg border border-yellow-300 dark:border-yellow-700">
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    💡 Tip: Zoom in closer (zoom level 6+) to see hexagonal plots appear on the map!
                  </p>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Buy Plots
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Click hexagons to buy virtual land. Plots with stations are premium!
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Install Chargers
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Add virtual chargers to your plots and earn from charging activity
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Earn Passive Income
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Real charging at stations in your plots = bonus earnings
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stats Bar */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">My Plots</p>
                  <p className="text-3xl font-bold text-purple-600">{ownedPlots.length}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">With Chargers</p>
                  <p className="text-3xl font-bold text-green-600">
                    {ownedPlots.filter(p => p.hasCharger).length}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Total Earnings</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {ownedPlots.reduce((sum, p) => sum + p.totalEarningsSol, 0).toFixed(3)} SOL
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Stations</p>
                  <p className="text-3xl font-bold text-cyan-600">{stations.length}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* World Map */}
          <Card>
            <CardContent className="pt-6">
              <Suspense fallback={<MapLoader />}>
                <WorldMap center={[52.52, 13.405]} zoom={10}>
                  <HexagonLayer
                    resolution={8}
                    ownedHexes={ownedHexes}
                    availableHexes={availableHexes}
                    premiumHexes={premiumHexes}
                    onHexClick={handleHexClick}
                  />
                  <StationMarkers
                    stations={stations}
                    onStationClick={handleStationClick}
                  />
                </WorldMap>
              </Suspense>
            </CardContent>
          </Card>

          {/* Selected Hex Info */}
          {selectedHex && (
            <Card className="border-purple-200 dark:border-purple-800">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2">Plot Details</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      H3 Index: {selectedHex.h3Index}
                    </p>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {selectedHex.lat.toFixed(4)}, {selectedHex.lng.toFixed(4)}
                        </span>
                      </div>
                      {premiumHexes.has(selectedHex.h3Index) && (
                        <Badge variant="destructive">Premium - Contains Station(s)</Badge>
                      )}
                      {ownedHexes.has(selectedHex.h3Index) ? (
                        <>
                          <Badge variant="default">You Own This Plot</Badge>
                          {(() => {
                            const plot = ownedPlots.find(p => p.h3Index === selectedHex.h3Index);
                            if (plot?.hasCharger) {
                              return (
                                <Badge variant="secondary" className="bg-green-100 dark:bg-green-900">
                                  ⚡ Level {plot.chargerLevel} Charger Installed
                                </Badge>
                              );
                            }
                            return null;
                          })()}
                        </>
                      ) : (
                        <Badge variant="secondary">Available for Purchase</Badge>
                      )}
                    </div>
                    
                    {/* Actions */}
                    {ownedHexes.has(selectedHex.h3Index) ? (
                      <div className="space-y-3">
                        {(() => {
                          const plot = ownedPlots.find(p => p.h3Index === selectedHex.h3Index);
                          if (!plot) return null;
                          
                          return (
                            <>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                  <p className="text-muted-foreground">Earnings</p>
                                  <p className="font-bold">{plot.totalEarningsSol.toFixed(4)} SOL</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Charges</p>
                                  <p className="font-bold">{plot.totalVirtualCharges + plot.totalRealCharges}</p>
                                </div>
                              </div>
                              
                              {!plot.hasCharger ? (
                                <Button
                                  onClick={() => {
                                    setSelectedPlotForCharger(plot);
                                    setShowChargerModal(true);
                                  }}
                                  className="w-full"
                                >
                                  <Zap className="h-4 w-4 mr-2" />
                                  Install Charger
                                </Button>
                              ) : plot.chargerLevel < 3 && (
                                <Button
                                  onClick={() => {
                                    setSelectedPlotForCharger(plot);
                                    setShowChargerModal(true);
                                  }}
                                  variant="outline"
                                  className="w-full"
                                >
                                  <TrendingUp className="h-4 w-4 mr-2" />
                                  Upgrade Charger
                                </Button>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    ) : (
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Price</p>
                          <p className="text-2xl font-bold">
                            {premiumHexes.has(selectedHex.h3Index) ? '0.1' : '0.01'} SOL
                          </p>
                        </div>
                        <Button
                          onClick={handleBuyPlot}
                          disabled={buying}
                          className="ml-auto"
                        >
                          {buying ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Buying...
                            </>
                          ) : (
                            <>
                              <DollarSign className="h-4 w-4 mr-2" />
                              Buy Plot
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedHex(null)}
                  >
                    Close
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Selected Station Info */}
          {selectedStation && (
            <Card className="border-cyan-200 dark:border-cyan-800">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-bold mb-2">{selectedStation.name}</h3>
                    <p className="text-muted-foreground mb-4">
                      {selectedStation.location.city}, {selectedStation.location.address}
                    </p>
                    <div className="flex items-center gap-4">
                      <Badge variant={selectedStation.status === 'available' ? 'default' : 'secondary'}>
                        {selectedStation.status}
                      </Badge>
                      <span className="text-sm">22kW AC</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedStation(null)}
                  >
                    Close
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Legend */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4">Legend</h3>
              <div className="grid gap-3 md:grid-cols-5">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-purple-500 opacity-40"></div>
                  <span className="text-sm">Your Plots</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-green-500 opacity-25"></div>
                  <span className="text-sm">Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-red-500 opacity-30"></div>
                  <span className="text-sm">Premium (Has Station)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-green-500"></div>
                  <span className="text-sm">Active Station</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-slate-500"></div>
                  <span className="text-sm">Inactive Station</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Charger Installation Modal */}
          {showChargerModal && selectedPlotForCharger && (
            <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold mb-2">
                      {selectedPlotForCharger.hasCharger ? 'Upgrade Charger' : 'Install Charger'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Choose your charger level
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowChargerModal(false);
                      setSelectedPlotForCharger(null);
                    }}
                  >
                    Close
                  </Button>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  {/* Level 1 */}
                  <Card className={`cursor-pointer transition-all ${selectedPlotForCharger.chargerLevel >= 1 ? 'opacity-50' : 'hover:shadow-lg hover:scale-105'}`}>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <Zap className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                        <h4 className="font-bold mb-1">Level 1</h4>
                        <p className="text-xs text-muted-foreground mb-3">Basic Charger</p>
                        <p className="text-2xl font-bold mb-2">0.01 SOL</p>
                        <p className="text-xs text-muted-foreground mb-3">7kW • 1x earnings</p>
                        <Button
                          size="sm"
                          className="w-full"
                          disabled={selectedPlotForCharger.chargerLevel >= 1 || installing}
                          onClick={() => handleInstallCharger(1)}
                        >
                          {selectedPlotForCharger.chargerLevel >= 1 ? 'Installed' : installing ? 'Installing...' : 'Install'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Level 2 */}
                  <Card className={`cursor-pointer transition-all ${selectedPlotForCharger.chargerLevel >= 2 ? 'opacity-50' : 'hover:shadow-lg hover:scale-105'}`}>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <Zap className="h-8 w-8 mx-auto mb-2 text-orange-500" />
                        <h4 className="font-bold mb-1">Level 2</h4>
                        <p className="text-xs text-muted-foreground mb-3">Fast Charger</p>
                        <p className="text-2xl font-bold mb-2">0.05 SOL</p>
                        <p className="text-xs text-muted-foreground mb-3">22kW • 2x earnings</p>
                        <Button
                          size="sm"
                          className="w-full"
                          disabled={selectedPlotForCharger.chargerLevel >= 2 || installing}
                          onClick={() => handleInstallCharger(2)}
                        >
                          {selectedPlotForCharger.chargerLevel >= 2 ? 'Installed' : installing ? 'Installing...' : 'Install'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Level 3 */}
                  <Card className={`cursor-pointer transition-all ${selectedPlotForCharger.chargerLevel >= 3 ? 'opacity-50' : 'hover:shadow-lg hover:scale-105'}`}>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <Zap className="h-8 w-8 mx-auto mb-2 text-red-500" />
                        <h4 className="font-bold mb-1">Level 3</h4>
                        <p className="text-xs text-muted-foreground mb-3">Ultra-Fast</p>
                        <p className="text-2xl font-bold mb-2">0.1 SOL</p>
                        <p className="text-xs text-muted-foreground mb-3">150kW • 5x earnings</p>
                        <Button
                          size="sm"
                          className="w-full"
                          disabled={selectedPlotForCharger.chargerLevel >= 3 || installing}
                          onClick={() => handleInstallCharger(3)}
                        >
                          {selectedPlotForCharger.chargerLevel >= 3 ? 'Installed' : installing ? 'Installing...' : 'Install'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Back Button */}
          <div className="flex justify-center pt-8">
            <Button 
              asChild 
              variant="outline" 
              size="lg"
              className="group hover:border-blue-300 dark:hover:border-blue-700"
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
