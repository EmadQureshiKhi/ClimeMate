import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logCertificateOnChain } from '@/lib/solana-nft';
import { ArciumSemaManager } from '@/lib/arcium-sema';
import CryptoJS from 'crypto-js';

// GET - List all stakeholders for a client
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      );
    }

    const stakeholders = await prisma.sEMAStakeholder.findMany({
      where: { clientId },
      orderBy: { totalScore: 'desc' },
    });

    return NextResponse.json({ stakeholders }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching stakeholders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stakeholders', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Create a new stakeholder
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId, walletAddress, ...stakeholderData } = body;

    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      );
    }

    // Get client to check privacy mode
    const client = await prisma.sEMAClient.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    // Transform snake_case to camelCase for Prisma
    const transformedData = {
      name: stakeholderData.name,
      category: stakeholderData.category,
      stakeholderType: stakeholderData.stakeholder_type || stakeholderData.stakeholderType,
      dependencyEconomic: stakeholderData.dependency_economic || stakeholderData.dependencyEconomic,
      dependencySocial: stakeholderData.dependency_social || stakeholderData.dependencySocial,
      dependencyEnvironmental: stakeholderData.dependency_environmental || stakeholderData.dependencyEnvironmental,
      influenceEconomic: stakeholderData.influence_economic || stakeholderData.influenceEconomic,
      influenceSocial: stakeholderData.influence_social || stakeholderData.influenceSocial,
      influenceEnvironmental: stakeholderData.influence_environmental || stakeholderData.influenceEnvironmental,
      populationSize: stakeholderData.population_size || stakeholderData.populationSize || 0,
    };

    // Calculate scores
    const totalScore = 
      transformedData.dependencyEconomic +
      transformedData.dependencySocial +
      transformedData.dependencyEnvironmental +
      transformedData.influenceEconomic +
      transformedData.influenceSocial +
      transformedData.influenceEnvironmental;

    const dependencyScore = 
      transformedData.dependencyEconomic +
      transformedData.dependencySocial +
      transformedData.dependencyEnvironmental;

    const influenceScore = 
      transformedData.influenceEconomic +
      transformedData.influenceSocial +
      transformedData.influenceEnvironmental;

    const dependencyCategory = dependencyScore >= 12 ? 'High' : dependencyScore >= 9 ? 'Medium' : 'Low';
    const influenceCategory = influenceScore >= 12 ? 'High' : influenceScore >= 9 ? 'Medium' : 'Low';
    const isPriority = influenceCategory === 'High' || dependencyCategory === 'High';

    const stakeholder = await prisma.sEMAStakeholder.create({
      data: {
        clientId,
        ...transformedData,
        totalScore,
        dependencyCategory,
        influenceCategory,
        isPriority,
      },
    });

    // Create audit log data
    const logData = {
      type: 'SEMA_AUDIT_LOG',
      version: '1.0',
      application: 'ClimeMate SEMA Tools',
      module: 'Stakeholder Management',
      action: 'Stakeholder Added',
      details: {
        clientId: client.id,
        clientName: client.name,
        stakeholderId: stakeholder.id,
        stakeholderName: stakeholder.name,
        category: stakeholder.category,
        stakeholderType: stakeholder.stakeholderType,
        totalScore: stakeholder.totalScore,
        isPriority: stakeholder.isPriority,
      },
      timestamp: new Date().toISOString(),
      user: walletAddress || 'system',
    };

    // Log to blockchain with privacy mode if enabled
    if (walletAddress) {
      try {
        let transactionSignature: string;
        let isPrivate = client.privacyMode;
        
        if (client.privacyMode) {
          // Use Arcium for private logging
          const arciumManager = new ArciumSemaManager();
          const authorizedWallets = [walletAddress, ...client.authorizedAuditors];
          
          const blockchainResult = await arciumManager.encryptAndLogStakeholder(
            stakeholder,
            client.name,
            walletAddress,
            authorizedWallets
          );
          
          if (!blockchainResult.success) {
            throw new Error(blockchainResult.error || 'Failed to log to blockchain');
          }
          
          transactionSignature = blockchainResult.signature!;
        } else {
          // Public blockchain logging - generate signature
          // In production, this would be an actual Solana transaction
          transactionSignature = `STAKEHOLDER-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        }

        // Save blockchain log to database
        await prisma.sEMABlockchainLog.create({
          data: {
            clientId: client.id,
            module: 'Stakeholder Management',
            action: 'stakeholder_added',
            transactionSignature,
            dataHash: CryptoJS.SHA256(JSON.stringify(logData)).toString(),
            details: logData,
            userWalletAddress: walletAddress,
            status: 'success',
            isPrivate,
          },
        });
      } catch (blockchainError: any) {
        console.error('Blockchain logging failed:', blockchainError);
        // Don't fail the stakeholder creation if blockchain logging fails
      }
    }

    return NextResponse.json({ stakeholder }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating stakeholder:', error);
    return NextResponse.json(
      { error: 'Failed to create stakeholder', details: error.message },
      { status: 500 }
    );
  }
}
