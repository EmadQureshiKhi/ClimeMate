import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const owner = searchParams.get('owner');
    const h3Index = searchParams.get('h3Index');

    if (h3Index) {
      // Get specific plot by H3 index
      const plot = await prisma.$queryRaw`
        SELECT * FROM virtual_plots WHERE h3_index = ${h3Index}
      `;
      
      return NextResponse.json({ plot: Array.isArray(plot) ? plot[0] : null });
    }

    if (owner) {
      // Get all plots owned by wallet
      const plots = await prisma.$queryRaw`
        SELECT * FROM virtual_plots 
        WHERE owner_wallet = ${owner}
        ORDER BY purchased_at DESC
      `;
      
      return NextResponse.json({ plots });
    }

    // Get summary stats
    const stats = await prisma.$queryRaw`
      SELECT 
        COUNT(*) as total_plots,
        COUNT(DISTINCT owner_wallet) as total_owners,
        SUM(CASE WHEN has_charger THEN 1 ELSE 0 END) as plots_with_chargers,
        SUM(total_earnings_sol) as total_earnings
      FROM virtual_plots
      WHERE owner_wallet IS NOT NULL
    `;

    return NextResponse.json({ stats: Array.isArray(stats) ? stats[0] : null });
  } catch (error) {
    console.error('Error fetching plots:', error);
    return NextResponse.json(
      { error: 'Failed to fetch plots' },
      { status: 500 }
    );
  }
}
