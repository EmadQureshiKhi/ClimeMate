import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Earnings multipliers by charger level
const CHARGER_MULTIPLIERS = {
  1: 1,   // Level 1: 1x
  2: 2,   // Level 2: 2x
  3: 5,   // Level 3: 5x
};

// Base fee per kWh
const BASE_FEE_PER_KWH = 0.0001; // 0.0001 SOL per kWh
const OWNER_CUT = 0.7; // Owner gets 70%, platform gets 30%

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { h3Index, chargerWallet, energyKwh, isRealCharge = false, realSessionId } = body;

    if (!h3Index || !chargerWallet || !energyKwh) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get plot info
    const plots = await prisma.$queryRaw`
      SELECT * FROM virtual_plots WHERE h3_index = ${h3Index}
    `;

    if (!Array.isArray(plots) || plots.length === 0) {
      return NextResponse.json(
        { error: 'Plot not found' },
        { status: 404 }
      );
    }

    const plot = plots[0] as any;

    // Check if plot has a charger
    if (!plot.has_charger) {
      return NextResponse.json(
        { error: 'Plot does not have a charger installed' },
        { status: 400 }
      );
    }

    // Calculate earnings
    const chargerLevel = plot.charger_level;
    const multiplier = CHARGER_MULTIPLIERS[chargerLevel as keyof typeof CHARGER_MULTIPLIERS] || 1;
    const realChargeBonus = isRealCharge ? 2 : 1; // 2x bonus for real charges
    
    const baseFee = energyKwh * BASE_FEE_PER_KWH;
    const totalFee = baseFee * multiplier * realChargeBonus;
    const ownerEarnings = totalFee * OWNER_CUT;

    // Record charging session
    await prisma.$executeRaw`
      INSERT INTO virtual_charging_sessions (
        plot_id, h3_index, charger_wallet, energy_kwh,
        fee_paid_sol, owner_earnings_sol, is_real_charge, real_session_id
      ) VALUES (
        ${plot.id}, ${h3Index}, ${chargerWallet}, ${energyKwh},
        ${totalFee}, ${ownerEarnings}, ${isRealCharge}, ${realSessionId}
      )
    `;

    // Update plot stats
    if (isRealCharge) {
      await prisma.$executeRaw`
        UPDATE virtual_plots 
        SET 
          total_real_charges = total_real_charges + 1,
          total_earnings_sol = total_earnings_sol + ${ownerEarnings},
          last_charge_at = NOW(),
          updated_at = NOW()
        WHERE id = ${plot.id}
      `;
    } else {
      await prisma.$executeRaw`
        UPDATE virtual_plots 
        SET 
          total_virtual_charges = total_virtual_charges + 1,
          total_earnings_sol = total_earnings_sol + ${ownerEarnings},
          last_charge_at = NOW(),
          updated_at = NOW()
        WHERE id = ${plot.id}
      `;
    }

    return NextResponse.json({
      success: true,
      message: 'Charging session recorded',
      earnings: {
        totalFee,
        ownerEarnings,
        platformFee: totalFee - ownerEarnings,
      },
      session: {
        energyKwh,
        chargerLevel,
        multiplier,
        isRealCharge,
      },
    });
  } catch (error) {
    console.error('Error recording charge:', error);
    return NextResponse.json(
      { error: 'Failed to record charging session' },
      { status: 500 }
    );
  }
}
