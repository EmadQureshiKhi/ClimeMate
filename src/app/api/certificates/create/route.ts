import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logCertificateToBlockchain, generateDataHash } from '@/lib/blockchain-logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📝 Certificate creation request:', body);
    
    const {
      userId: privyUserId,
      emissionDataId,
      certificateId,
      title,
      totalEmissions,
      breakdown,
      processedData,
      summary,
      dataHash,
      blockchainTx,
      nftAddress,
      metadataUri,
      logTransactionSignature,
      // NEW: Privacy fields
      isPrivate,
      encryptedDataId,
      arciumSignature,
      arciumDataHash,
      authorizedViewers,
    } = body;

    if (!privyUserId || !certificateId) {
      console.error('❌ Missing required fields:', { privyUserId, certificateId });
      return NextResponse.json(
        { error: 'User ID and Certificate ID are required' },
        { status: 400 }
      );
    }

    // Look up user by Privy ID to get database ID
    const user = await prisma.user.findUnique({
      where: { privyId: privyUserId },
    });

    if (!user) {
      console.error('❌ User not found:', privyUserId);
      return NextResponse.json(
        { error: 'User not found. Please ensure you are logged in.' },
        { status: 404 }
      );
    }

    // Calculate valid until date (1 year from now)
    const validUntil = new Date();
    validUntil.setFullYear(validUntil.getFullYear() + 1);

    console.log('💾 Creating certificate with data:', {
      userId: user.id,
      privyUserId,
      emissionDataId,
      certificateId,
      title,
      totalEmissions,
      hasBreakdown: !!breakdown,
      validUntil,
    });

    // Validate emissionDataId if provided
    let validEmissionDataId = null;
    if (emissionDataId && !emissionDataId.startsWith('emission-')) {
      // Only use emissionDataId if it's a real database ID (not a temp ID)
      const emissionData = await prisma.emissionData.findUnique({
        where: { id: emissionDataId },
      });
      if (emissionData) {
        validEmissionDataId = emissionDataId;
      }
    }

    // Create certificate in database
    const certificate = await prisma.certificate.create({
      data: {
        userId: user.id, // Use database user ID, not Privy ID
        emissionDataId: validEmissionDataId,
        certificateId,
        title,
        totalEmissions,
        // If private mode, don't store breakdown/processedData
        breakdown: isPrivate ? null : breakdown,
        processedData: isPrivate ? null : processedData,
        summary,
        status: 'verified',
        issueDate: new Date(),
        validUntil,
        dataHash,
        blockchainTx,
        nftAddress,
        metadataUri,
        logTransactionSignature,
        ipfsCid: nftAddress, // Keep for backward compatibility
        // NEW: Privacy fields
        isPrivate: isPrivate || false,
        encryptedDataId: isPrivate ? encryptedDataId : null,
        arciumSignature: isPrivate ? arciumSignature : null,
        arciumDataHash: isPrivate ? arciumDataHash : null,
        authorizedViewers: isPrivate && authorizedViewers ? authorizedViewers : [],
      },
    });

    console.log(
      isPrivate 
        ? '🔒 Private certificate created successfully:' 
        : '✅ Certificate created successfully:', 
      certificate.id
    );

    // Log certificate creation to audit logs
    try {
      const walletAddress = user.walletAddress || '';
      if (walletAddress) {
        // Determine if this is from GHG Calculator or Upload Data
        const isGHGCalculator = certificateId.startsWith('GHG-CALC-');
        const isUploadData = certificateId.startsWith('GHG-') && !isGHGCalculator;
        
        const module = isGHGCalculator ? 'GHG Calculator' : 'Certificate Generation';
        const action = isPrivate 
          ? (isUploadData ? 'private_upload_data_certificate' : 'private_certificate_created')
          : (isUploadData ? 'upload_data_certificate' : 'certificate_created');
        
        // Build details based on source and privacy mode
        const logDetails: any = {
          certificateId: certificate.certificateId,
          title: certificate.title,
          totalEmissions: certificate.totalEmissions, // Always public
          status: certificate.status,
          issueDate: certificate.issueDate,
        };
        
        if (isPrivate) {
          // Private mode: Log encryption event
          logDetails.isPrivate = true;
          logDetails.encryptedDataId = encryptedDataId;
          logDetails.arciumSignature = arciumSignature;
          logDetails.dataHash = arciumDataHash;
          logDetails.scopeBreakdown = 'ENCRYPTED';
          if (authorizedViewers && authorizedViewers.length > 0) {
            logDetails.authorizedViewers = authorizedViewers.length;
          }
        } else {
          // Public mode: Log full data
          // For Upload Data, include breakdown categories
          if (isUploadData && breakdown) {
            logDetails.breakdown = breakdown;
            logDetails.categories = Object.keys(breakdown).length;
          }
          
          // For GHG Calculator, include scope breakdown
          if (isGHGCalculator && breakdown) {
            logDetails.scope1 = breakdown.scope1 || 0;
            logDetails.scope2 = breakdown.scope2 || 0;
            logDetails.scope3 = breakdown.scope3 || 0;
          }
        }
        
        await fetch(`${request.nextUrl.origin}/api/audit-logs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            module,
            action,
            transactionSignature: logTransactionSignature || arciumSignature || blockchainTx || '',
            details: logDetails,
            userWalletAddress: walletAddress,
            userId: privyUserId,
          }),
        });
        console.log(
          isPrivate 
            ? '🔒 Private audit log created for certificate' 
            : '✅ Audit log created for certificate'
        );
      }
    } catch (logError) {
      console.error('Failed to create audit log:', logError);
      // Don't fail the whole operation if logging fails
    }

    return NextResponse.json({ certificate }, { status: 201 });
  } catch (error: any) {
    console.error('❌ Error creating certificate:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
    });
    return NextResponse.json(
      { error: 'Failed to create certificate', details: error.message },
      { status: 500 }
    );
  }
}
