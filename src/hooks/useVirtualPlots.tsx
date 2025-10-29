'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

interface VirtualPlot {
  id: number;
  h3Index: string;
  centerLat: number;
  centerLng: number;
  ownerWallet: string | null;
  purchasePriceSol: number | null;
  currentPriceSol: number | null;
  hasCharger: boolean;
  chargerLevel: number;
  stationCount: number;
  isPremium: boolean;
  totalVirtualCharges: number;
  totalRealCharges: number;
  totalEarningsSol: number;
}

interface UseVirtualPlotsReturn {
  ownedPlots: VirtualPlot[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  buyPlot: (h3Index: string, priceSol: number) => Promise<boolean>;
  installCharger: (plotId: number, level: number) => Promise<boolean>;
}

export function useVirtualPlots(): UseVirtualPlotsReturn {
  const { walletAddress } = useAuth();
  const [ownedPlots, setOwnedPlots] = useState<VirtualPlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOwnedPlots = async () => {
    if (!walletAddress) {
      setOwnedPlots([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/virtual-world/plots?owner=${walletAddress}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch plots');
      }

      const data = await response.json();
      console.log('Fetched plots:', data.plots);
      
      // Map snake_case to camelCase
      const mappedPlots = (data.plots || []).map((plot: any) => ({
        id: plot.id,
        h3Index: plot.h3_index,
        centerLat: parseFloat(plot.center_lat),
        centerLng: parseFloat(plot.center_lng),
        ownerWallet: plot.owner_wallet,
        purchasePriceSol: plot.purchase_price_sol ? parseFloat(plot.purchase_price_sol) : null,
        currentPriceSol: plot.current_price_sol ? parseFloat(plot.current_price_sol) : null,
        hasCharger: plot.has_charger,
        chargerLevel: plot.charger_level,
        stationCount: plot.station_count,
        isPremium: plot.is_premium,
        totalVirtualCharges: plot.total_virtual_charges,
        totalRealCharges: plot.total_real_charges,
        totalEarningsSol: plot.total_earnings_sol ? parseFloat(plot.total_earnings_sol) : 0,
      }));
      
      console.log('Mapped plots:', mappedPlots);
      setOwnedPlots(mappedPlots);
    } catch (err) {
      console.error('Error fetching plots:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setOwnedPlots([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOwnedPlots();
  }, [walletAddress]);

  const buyPlot = async (
    h3Index: string, 
    priceSol: number,
    transactionSignature?: string
  ): Promise<boolean> => {
    if (!walletAddress) {
      setError('Wallet not connected');
      return false;
    }

    try {
      const response = await fetch('/api/virtual-world/plots/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          h3Index,
          walletAddress,
          priceSol,
          transactionSignature,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to buy plot');
      }

      await fetchOwnedPlots();
      return true;
    } catch (err) {
      console.error('Error buying plot:', err);
      setError(err instanceof Error ? err.message : 'Failed to buy plot');
      return false;
    }
  };

  const installCharger = async (
    plotId: number, 
    level: number,
    transactionSignature?: string
  ): Promise<boolean> => {
    if (!walletAddress) {
      setError('Wallet not connected');
      return false;
    }

    try {
      const response = await fetch('/api/virtual-world/plots/install-charger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plotId,
          walletAddress,
          level,
          transactionSignature,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to install charger');
      }

      await fetchOwnedPlots();
      return true;
    } catch (err) {
      console.error('Error installing charger:', err);
      setError(err instanceof Error ? err.message : 'Failed to install charger');
      return false;
    }
  };

  return {
    ownedPlots,
    isLoading,
    error,
    refetch: fetchOwnedPlots,
    buyPlot,
    installCharger,
  };
}
