import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Gateway Analytics API
 * 
 * Stores transaction metrics for the Gateway Analytics Dashboard
 * This demonstrates real-time observability - a key Gateway feature
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      signature,
      metrics,
      timestamp,
      deliveryMethod,
      success,
      error,
    } = body;
    
    // Store in database (we'll create a GatewayAnalytics table)
    // For now, log to console
    console.log('📊 Gateway Analytics:', {
      signature,
      metrics,
      deliveryMethod,
      success,
    });
    
    // TODO: Store in database for dashboard
    // await prisma.gatewayAnalytics.create({
    //   data: {
    //     signature,
    //     buildTime: metrics.buildTime,
    //     signTime: metrics.signTime,
    //     deliveryTime: metrics.deliveryTime,
    //     totalTime: metrics.totalTime,
    //     deliveryMethod,
    //     success,
    //     error,
    //     timestamp: new Date(timestamp),
    //   },
    // });
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to save Gateway analytics:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Return analytics data for dashboard
    // For now, return mock data
    const analytics = {
      totalTransactions: 1250,
      successRate: 99.8,
      averageBuildTime: 145,
      averageDeliveryTime: 892,
      totalCostSavings: 12500000, // lamports
      deliveryMethods: {
        'gateway-multi-path': 1200,
        'rpc': 30,
        'jito': 20,
      },
      recentTransactions: [
        {
          signature: '5Kq7...',
          timestamp: new Date().toISOString(),
          deliveryMethod: 'gateway-multi-path',
          buildTime: 150,
          deliveryTime: 900,
          success: true,
          costSavings: 10000,
        },
      ],
    };
    
    return NextResponse.json(analytics);
  } catch (error: any) {
    console.error('Failed to fetch Gateway analytics:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
