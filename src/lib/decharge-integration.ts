/**
 * DeCharge EV Charging Integration
 * Connects EV charging sessions with carbon credit rewards
 */

import { Connection, PublicKey } from '@solana/web3.js';

// Types
export interface ChargingSession {
  sessionId: string;
  stationId: string;
  userWallet: string;
  energyUsed: number; // kWh
  startTime: Date;
  endTime?: Date;
  cost: number;
  co2eSaved: number; // Calculated
  creditsEarned: number; // CO₂e tokens
  pointsEarned: number; // Charging points
  status: 'active' | 'completed' | 'cancelled';
}

export interface ChargingStation {
  stationId: string;
  name: string;
  location: {
    lat: number;
    lng: number;
    address: string;
    city: string;
    country: string;
  };
  power: number; // kW
  connectorType: string;
  available: boolean;
  totalSessions: number;
  totalEnergy: number;
  totalCO2eSaved: number;
}

export interface ChargingPoint {
  userWallet: string;
  points: number;
  earned: number;
  purchased: number;
  spent: number;
}

// Constants
const CO2E_PER_KWH = 0.5; // kg CO₂e saved per kWh (average grid emissions)
const POINTS_PER_KWH = 10; // Charging points earned per kWh
const CREDITS_PER_KWH = 0.5; // CO₂e tokens earned per kWh

/**
 * Calculate CO₂e saved from EV charging
 * Based on average grid emissions vs zero EV emissions
 */
export function calculateCO2eSaved(kWh: number): number {
  return kWh * CO2E_PER_KWH;
}

/**
 * Calculate charging points earned
 */
export function calculatePointsEarned(kWh: number): number {
  return Math.floor(kWh * POINTS_PER_KWH);
}

/**
 * Calculate CO₂e credits earned
 */
export function calculateCreditsEarned(kWh: number): number {
  return kWh * CREDITS_PER_KWH;
}

/**
 * Parse DeCharge charging session data
 * Sample JSON structure from DeCharge API
 */
export function parseChargingSession(data: any): ChargingSession {
  const energyUsed = data.energy_kwh || data.energyUsed || 0;
  
  return {
    sessionId: data.session_id || data.id,
    stationId: data.station_id || data.stationId,
    userWallet: data.user_wallet || data.userWallet,
    energyUsed,
    startTime: new Date(data.start_time || data.startTime),
    endTime: data.end_time ? new Date(data.end_time) : undefined,
    cost: data.cost || 0,
    co2eSaved: calculateCO2eSaved(energyUsed),
    creditsEarned: calculateCreditsEarned(energyUsed),
    pointsEarned: calculatePointsEarned(energyUsed),
    status: data.status || 'active',
  };
}

/**
 * Parse DeCharge station data
 */
export function parseChargingStation(data: any): ChargingStation {
  return {
    stationId: data.station_id || data.id,
    name: data.name || `Station ${data.id}`,
    location: {
      lat: data.latitude || data.lat || 0,
      lng: data.longitude || data.lng || 0,
      address: data.address || '',
      city: data.city || '',
      country: data.country || '',
    },
    power: data.power_kw || data.power || 50,
    connectorType: data.connector_type || data.connectorType || 'Type 2',
    available: data.available !== false,
    totalSessions: data.total_sessions || 0,
    totalEnergy: data.total_energy || 0,
    totalCO2eSaved: calculateCO2eSaved(data.total_energy || 0),
  };
}

/**
 * Fetch charging sessions for a user
 * Supports both real DeCharge API and mock data
 */
export async function fetchChargingSessions(
  userWallet: string
): Promise<ChargingSession[]> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_DECHARGE_API_KEY;
    const apiUrl = process.env.NEXT_PUBLIC_DECHARGE_API_URL;
    
    // If API credentials are configured, use real API
    if (apiKey && apiUrl) {
      console.log('📡 Fetching from DeCharge API...');
      const response = await fetch(`${apiUrl}/sessions?wallet=${userWallet}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`DeCharge API error: ${response.status}`);
      }
      
      const data = await response.json();
      return data.sessions?.map(parseChargingSession) || [];
    }
    
    // Otherwise, use mock data for development
    console.log('🔧 Using mock data (set NEXT_PUBLIC_DECHARGE_API_KEY for real data)');
    return getMockChargingSessions(userWallet);
  } catch (error) {
    console.error('Error fetching charging sessions:', error);
    // Fallback to mock data on error
    return getMockChargingSessions(userWallet);
  }
}

/**
 * Fetch all charging stations
 * Supports both real DeCharge API and mock data
 */
export async function fetchChargingStations(): Promise<ChargingStation[]> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_DECHARGE_API_KEY;
    const apiUrl = process.env.NEXT_PUBLIC_DECHARGE_API_URL;
    
    // If API credentials are configured, use real API
    if (apiKey && apiUrl) {
      console.log('📡 Fetching stations from DeCharge API...');
      const response = await fetch(`${apiUrl}/stations`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`DeCharge API error: ${response.status}`);
      }
      
      const data = await response.json();
      return data.stations?.map(parseChargingStation) || [];
    }
    
    // Otherwise, use mock data
    console.log('🔧 Using mock stations');
    return getMockChargingStations();
  } catch (error) {
    console.error('Error fetching charging stations:', error);
    return getMockChargingStations();
  }
}

/**
 * Mint CO₂e credits for a charging session
 */
export async function mintChargingCredits(
  session: ChargingSession,
  userWallet: string
): Promise<{ success: boolean; signature?: string; error?: string }> {
  try {
    // Call the API to mint credits
    const response = await fetch('/api/charging/mint-credits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: session.sessionId,
        userWallet,
        amount: session.creditsEarned,
        co2eSaved: session.co2eSaved,
        energyUsed: session.energyUsed,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to mint credits');
    }

    const data = await response.json();
    return {
      success: true,
      signature: data.signature,
    };
  } catch (error: any) {
    console.error('Error minting charging credits:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// ============================================
// Real DeCharge Data (from provided JSON)
// ============================================

// Import real DeCharge station data
import dechargeStationsData from '@/data/decharge-stations.json';

function getMockChargingSessions(userWallet: string): ChargingSession[] {
  const now = new Date();
  const sessions: ChargingSession[] = [];
  const stations = dechargeStationsData.charge_points;
  
  // Generate realistic sessions based on real DeCharge stations
  for (let i = 0; i < 8; i++) {
    const station = stations[i % stations.length];
    const connector = station.connectors[0];
    
    // Calculate realistic charging duration based on power
    const powerKw = connector.power_kw;
    const energyUsed = powerKw * (0.5 + Math.random() * 2); // 0.5-2.5 hours of charging
    const durationHours = energyUsed / powerKw;
    const durationMs = durationHours * 60 * 60 * 1000;
    
    // Sessions from the past week
    const daysAgo = i + 1;
    const startTime = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    const endTime = new Date(startTime.getTime() + durationMs);
    
    // Calculate cost based on DeCharge pricing (INR)
    const costINR = energyUsed * station.pricing.energy_based.rate;
    const costUSD = costINR / 83; // Convert INR to USD (approximate)
    
    sessions.push({
      sessionId: `${station.code}-${Date.now()}-${i}`,
      stationId: station.code,
      userWallet,
      energyUsed,
      startTime,
      endTime,
      cost: costUSD,
      co2eSaved: calculateCO2eSaved(energyUsed),
      creditsEarned: calculateCreditsEarned(energyUsed),
      pointsEarned: calculatePointsEarned(energyUsed),
      status: 'completed',
    });
  }
  
  return sessions.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
}

function getMockChargingStations(): ChargingStation[] {
  const stations = dechargeStationsData.charge_points;
  
  return stations.map((station) => {
    // Calculate total energy from random historical usage
    const totalSessions = Math.floor(Math.random() * 500) + 100;
    const avgEnergyPerSession = station.connectors[0].power_kw * 1.5; // Avg 1.5 hours
    const totalEnergy = totalSessions * avgEnergyPerSession;
    
    return {
      stationId: station.code,
      name: station.name,
      location: {
        lat: station.location.latitude,
        lng: station.location.longitude,
        address: station.location.address,
        city: station.location.city,
        country: 'India',
      },
      power: station.connectors[0].power_kw,
      connectorType: station.connectors[0].type,
      available: station.status === 'active' && station.connectors.some(c => c.status === 'available'),
      totalSessions,
      totalEnergy,
      totalCO2eSaved: calculateCO2eSaved(totalEnergy),
    };
  });
}

/**
 * Format energy amount for display
 */
export function formatEnergy(kWh: number): string {
  return `${kWh.toFixed(2)} kWh`;
}

/**
 * Format CO₂e amount for display
 */
export function formatCO2e(kg: number): string {
  return `${kg.toFixed(2)} kg CO₂e`;
}

/**
 * Format charging points for display
 */
export function formatPoints(points: number): string {
  return `${points.toLocaleString()} pts`;
}
