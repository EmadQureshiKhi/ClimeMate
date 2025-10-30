'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Award,
  Download,
  Share2,
  CheckCircle,
  ArrowLeft,
  Loader2,
  ExternalLink,
  Copy
} from 'lucide-react';
import { format } from 'date-fns';
import CryptoJS from 'crypto-js';
import { QuestionnaireData, EmissionEntry } from '@/types/ghg';
import { usePrivy } from '@privy-io/react-auth';
import { useWallets } from '@privy-io/react-auth/solana';
import { logCertificateOnChain } from '@/lib/solana-nft';
import { PrivacyToggle } from '@/components/privacy/privacy-toggle';
import { ArciumCertificateClient } from '@/lib/arcium-certificates';

interface GHGCertificatePreviewProps {
  questionnaire: QuestionnaireData;
  entries: EmissionEntry[];
  totalEmissions: number;
  calculations: {
    totalEmissions: number;
    categoryBreakdown: Record<string, number>;
    breakdown: Record<string, number>;
    summary: {
      processedRows: number;
      totalRows: number;
      categories: number;
    };
    processedData?: any[];
  };
  onGenerate: (certificate: any) => void;
  onPrevious: () => void;
}

export function GHGCertificatePreview({
  questionnaire,
  entries,
  totalEmissions,
  calculations,
  onGenerate,
  onPrevious
}: GHGCertificatePreviewProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [certificate, setCertificate] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [isPrivateMode, setIsPrivateMode] = useState(false); // NEW: Privacy toggle state
  const { user, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const walletAddress = wallets[0]?.address;

  const generateCertificate = async () => {
    if (!authenticated || !walletAddress) {
      alert('Please connect your Solana wallet first');
      return;
    }

    setIsGenerating(true);

    try {
      console.log('🎨 Generating GHG Calculator certificate...');

      // 1. Generate certificate ID and data hash
      const certificateId = `GHG-CALC-${Date.now()}`;
      const title = `${questionnaire.orgName || 'Organization'} - GHG Calculator Certificate - ${format(new Date(), 'MMM yyyy')}`;

      // Generate comprehensive data hash from GHG calculator session
      const hashData = {
        questionnaire: {
          orgName: questionnaire.orgName,
          boundaryApproach: questionnaire.boundaryApproach,
          controlSubtype: questionnaire.controlSubtype,
          operationalBoundary: questionnaire.operationalBoundary,
          emissionSources: questionnaire.emissionSources
        },
        totalEmissions: totalEmissions,
        categoryBreakdown: calculations.categoryBreakdown,
        breakdown: calculations.breakdown,
        summary: calculations.summary,
        entriesCount: entries.length,
        entries: entries.map(entry => ({
          scope: entry.scope,
          category: entry.category,
          fuelType: entry.fuelType,
          amount: entry.amount,
          emissions: entry.emissions
        })),
        timestamp: new Date().toISOString()
      };

      const dataHash = CryptoJS.SHA256(JSON.stringify(hashData)).toString();

      // 2. Handle privacy mode encryption (if enabled)
      let encryptedDataId = null;
      let arciumSignature = null;
      let arciumDataHash = null;

      if (isPrivateMode) {
        console.log('🔒 Private mode enabled - encrypting emissions data...');
        try {
          const arciumClient = new ArciumCertificateClient();
          // Store full breakdown data for decryption later
          const emissionsData = {
            scope1: calculations.breakdown.scope1 || 0,
            scope2: calculations.breakdown.scope2 || 0,
            scope3: calculations.breakdown.scope3 || 0,
            total: totalEmissions,
            categoryBreakdown: calculations.categoryBreakdown, // Store detailed breakdown
            timestamp: Date.now(),
          };

          const encryptResult = await arciumClient.storePrivateCertificate(
            emissionsData,
            walletAddress
          );

          if (encryptResult.success) {
            encryptedDataId = encryptResult.certificateId;
            arciumSignature = encryptResult.signature;
            arciumDataHash = encryptResult.dataHash;
            console.log('✅ Emissions data encrypted:', encryptedDataId);
          } else {
            throw new Error(encryptResult.error || 'Failed to encrypt data');
          }
        } catch (error: any) {
          console.error('❌ Encryption failed:', error);
          alert(`Failed to encrypt data: ${error.message}`);
          setIsGenerating(false);
          return;
        }
      }

      // 3. Pre-save certificate to database (so metadata endpoint works immediately)
      console.log('💾 Pre-saving certificate to database...');
      const emissionDataId = `emission-${Date.now()}`;
      
      // Include questionnaire data in processedData for storage
      const enrichedProcessedData = entries.map(entry => ({
        ...entry,
        questionnaire: {
          orgName: questionnaire.orgName,
          boundaryApproach: questionnaire.boundaryApproach,
          controlSubtype: questionnaire.controlSubtype,
          operationalBoundary: questionnaire.operationalBoundary,
          emissionSources: questionnaire.emissionSources,
        }
      }));
      
      const preSaveResponse = await fetch('/api/certificates/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          emissionDataId,
          certificateId,
          title,
          totalEmissions,
          // If private mode, don't send breakdown/processedData
          breakdown: isPrivateMode ? null : calculations.categoryBreakdown,
          processedData: isPrivateMode ? null : enrichedProcessedData,
          summary: {
            ...calculations.summary,
            questionnaire: questionnaire, // Add questionnaire to summary
          },
          dataHash,
          blockchainTx: null,
          nftAddress: null,
          metadataUri: null,
          logTransactionSignature: null,
          // NEW: Privacy fields
          isPrivate: isPrivateMode,
          encryptedDataId,
          arciumSignature,
          arciumDataHash,
          authorizedViewers: [], // Can be extended later
        }),
      });

      if (!preSaveResponse.ok) {
        throw new Error('Failed to pre-save certificate to database');
      }

      const { certificate: preSavedCertificate } = await preSaveResponse.json();
      console.log('✅ Certificate pre-saved:', preSavedCertificate.id);

      // 4. Mint compressed NFT
      console.log(isPrivateMode ? '🔒 Minting private NFT...' : '🎨 Minting compressed NFT...');
      const nftResponse = await fetch('/api/nft/mint-compressed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          certificateData: {
            certificateId,
            title: isPrivateMode ? `Private ${title}` : title,
            totalEmissions,
            // If private mode, don't include breakdown in NFT metadata
            breakdown: isPrivateMode ? null : calculations.categoryBreakdown,
            issueDate: new Date().toISOString(),
            isPrivate: isPrivateMode,
            encryptedDataId: isPrivateMode ? encryptedDataId : null,
          },
          userWallet: walletAddress,
          userId: user?.id,
        }),
      });

      const nftResult = await nftResponse.json();

      if (!nftResponse.ok || !nftResult.success) {
        throw new Error(nftResult.error || nftResult.details || 'Failed to mint NFT');
      }

      console.log('✅ NFT minted:', nftResult.transactionSignature);

      // 4. Log certificate on-chain
      console.log('📝 Logging certificate on blockchain...');
      let logSignature = null;

      try {
        // Get the first wallet (same as upload flow)
        const wallet = wallets[0];
        
        if (!wallet) {
          console.warn('⚠️ No wallet found, skipping memo log');
        } else {
          // Create minimal log data for on-chain (to avoid compute unit limits)
          // Full data is already in the database and NFT metadata
          const logResult = await logCertificateOnChain(
            walletAddress,
            {
              type: isPrivateMode ? 'PRIVATE_CERT' : 'GHG_CERT',
              certId: certificateId,
              hash: dataHash,
              total: totalEmissions,
              private: isPrivateMode ? 1 : 0,
              ts: Date.now(),
            },
            async (txData: any) => {
              const result = await wallet.signAndSendTransaction(txData);
              return result;
            }
          );

          if (logResult.success) {
            logSignature = logResult.signature;
            console.log('✅ Certificate logged on-chain:', logSignature);
          } else {
            console.warn('⚠️ Failed to log certificate on-chain:', logResult.error);
          }
        }
      } catch (error) {
        console.warn('⚠️ Failed to log certificate on-chain:', error);
        // Don't fail the whole process - memo log is optional
      }

      // 5. Update certificate with blockchain data
      console.log('🔄 Updating certificate with blockchain data...');
      const updateResponse = await fetch(`/api/certificates/${preSavedCertificate.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blockchainTx: nftResult.transactionSignature,
          nftAddress: nftResult.nftAddress,
          metadataUri: nftResult.metadataUri,
          logTransactionSignature: logSignature,
        }),
      });

      let finalCertificate = preSavedCertificate;
      if (updateResponse.ok) {
        const { certificate: updatedCertificate } = await updateResponse.json();
        finalCertificate = updatedCertificate;
        console.log('✅ Certificate updated with blockchain data');
      }

      // 6. Set certificate state
      const result = {
        ...finalCertificate,
        nftAddress: nftResult.nftAddress,
        transactionSignature: nftResult.transactionSignature,
        metadataUri: nftResult.metadataUri,
        logTransactionSignature: logSignature,
      };

      setCertificate(result);
      onGenerate(result);
      
      console.log('🎉 Certificate generation complete!');
    } catch (error) {
      let errorMessage = 'Unknown error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        errorMessage = JSON.stringify(error);
      } else {
        errorMessage = String(error);
      }
      console.error(`Failed to create certificate: ${errorMessage}`);
      alert(`Failed to generate certificate: ${errorMessage}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadCertificatePDF = () => {
    const content = `
GHG CALCULATOR CERTIFICATE
==========================

Organization: ${questionnaire.orgName}
Certificate ID: ${certificate?.certificate_id}
Assessment Type: GHG Calculator Tool

ORGANIZATIONAL DETAILS:
Boundary Approach: ${questionnaire.boundaryApproach}
${questionnaire.controlSubtype ? `Control Type: ${questionnaire.controlSubtype}` : ''}
Operational Boundary: ${questionnaire.operationalBoundary}
Emission Sources: ${questionnaire.emissionSources}

EMISSIONS SUMMARY:
Total Emissions: ${totalEmissions.toLocaleString()} kg CO₂e
Total Activities: ${entries.length}
Assessment Date: ${format(new Date(), 'PPP')}

EMISSIONS BREAKDOWN BY CATEGORY:
${Object.entries(calculations.categoryBreakdown).map(([category, emissions]) =>
  `${category}: ${Number(emissions).toFixed(2)} kg CO₂e`
).join('\n')}

DETAILED CALCULATIONS:
${entries.map((entry, index) =>
  `${index + 1}. ${entry.scope} - ${entry.fuelType}: ${entry.amount} ${entry.unit_type} = ${entry.emissions.toFixed(2)} kg CO₂e`
).join('\n')}

BLOCKCHAIN VERIFICATION:
Blockchain verification coming soon with Solana integration
${certificate?.data_hash ? `Data Hash: ${certificate.data_hash}` : 'No data hash'}

Generated: ${new Date().toLocaleString()}
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GHG_Certificate_${certificate?.certificate_id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Certificate Preview */}
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950"></div>
        <CardHeader className="relative">
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Award className="h-6 w-6 text-green-600" />
            GHG Calculator Certificate
          </CardTitle>
          <CardDescription>
            Blockchain-verified carbon footprint certificate from GHG Calculator
          </CardDescription>
        </CardHeader>
        <CardContent className="relative space-y-6">
          <div className="bg-white dark:bg-gray-900 p-8 rounded-lg border-2 border-green-200 dark:border-green-800 shadow-lg">
            <div className="text-center space-y-4 mb-8">
              <div className="w-16 h-16 mx-auto bg-green-600 rounded-full flex items-center justify-center">
                <Award className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-green-600">
                GHG Calculator Certificate
              </h2>
              <p className="text-muted-foreground">
                This certificate verifies the carbon footprint calculation from GHG Calculator
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Organization</label>
                  <p className="text-xl font-bold text-primary">
                    {questionnaire.orgName}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Total Emissions</label>
                  <p className="text-2xl font-bold text-primary">
                    {totalEmissions.toLocaleString()} kg CO₂e
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Issue Date</label>
                  <p className="font-medium">{format(new Date(), 'PPP')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Valid Until</label>
                  <p className="font-medium">{format(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), 'PPP')}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Assessment Scope</label>
                  <p className="font-medium">{questionnaire.emissionSources}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Boundary Approach</label>
                  <p className="font-medium">{questionnaire.boundaryApproach}</p>
                  {questionnaire.controlSubtype && (
                    <p className="text-sm text-muted-foreground">→ {questionnaire.controlSubtype}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Categories</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {Object.keys(calculations.categoryBreakdown).map((category) => (
                      <Badge key={category} variant="secondary">
                        {category}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Activities Calculated</label>
                  <p className="font-medium">{entries.length} entries</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                </div>
              </div>
            </div>

          </div>

          {/* Privacy Toggle */}
          {!certificate && (
            <div className="mt-6">
              <PrivacyToggle
                enabled={isPrivateMode}
                onToggle={setIsPrivateMode}
                label="Private Mode"
                description="Encrypt emissions breakdown using Arcium MPC"
                showDetails={true}
              />
            </div>
          )}

          {/* Generation Button */}
          {!certificate && (
            <div className="text-center mt-6">
              <Button
                size="lg"
                onClick={generateCertificate}
                disabled={isGenerating}
                className="bg-green-600 hover:bg-green-700"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    {isPrivateMode ? 'Encrypting & Generating...' : 'Generating Certificate...'}
                  </>
                ) : (
                  <>
                    <Award className="h-5 w-5 mr-2" />
                    {isPrivateMode ? 'Generate Private Certificate' : 'Generate Certificate'}
                  </>
                )}
              </Button>
              <p className="text-sm text-muted-foreground mt-2">
                {isPrivateMode 
                  ? '🔒 Your emissions breakdown will be encrypted. Total emissions remain public for verification.'
                  : 'This will create a verified certificate with blockchain verification.'
                }
              </p>
            </div>
          )}

          {/* Success Actions */}
          {certificate && (
            <div className="space-y-4">
              <Alert className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  Certificate generated successfully! Your emissions data has been verified and recorded on Solana blockchain.
                </AlertDescription>
              </Alert>

              {/* Blockchain Verification */}
              {certificate.transactionSignature && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      Blockchain Verification
                    </CardTitle>
                    <CardDescription>
                      Your certificate has been permanently recorded on Solana blockchain
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-start justify-between p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                          NFT Mint Transaction
                        </p>
                        <p className="text-xs text-blue-700 dark:text-blue-300 font-mono break-all">
                          {certificate.transactionSignature}
                        </p>
                      </div>
                      <a
                        href={`https://explorer.solana.com/tx/${certificate.transactionSignature}?cluster=devnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-3 flex-shrink-0"
                      >
                        <Button size="sm" variant="outline" className="h-8">
                          <ExternalLink className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      </a>
                    </div>

                    {certificate.logTransactionSignature && (
                      <div className="flex items-start justify-between p-3 bg-purple-50 dark:bg-purple-950 rounded-lg border border-purple-200 dark:border-purple-800">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-purple-900 dark:text-purple-100 mb-1">
                            Audit Log Transaction
                          </p>
                          <p className="text-xs text-purple-700 dark:text-purple-300 font-mono break-all">
                            {certificate.logTransactionSignature}
                          </p>
                        </div>
                        <a
                          href={`https://explorer.solana.com/tx/${certificate.logTransactionSignature}?cluster=devnet`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-3 flex-shrink-0"
                        >
                          <Button size="sm" variant="outline" className="h-8">
                            <ExternalLink className="h-3 w-3 mr-1" />
                            View
                          </Button>
                        </a>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <div className="flex flex-wrap gap-3 justify-center">
                <Button onClick={downloadCertificatePDF} variant="outline" size="lg">
                  <Download className="h-4 w-4 mr-2" />
                  Download Certificate
                </Button>
                <Button variant="outline" size="lg" onClick={() => copyToClipboard(certificate.certificateId)}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Certificate ID
                </Button>
                <Button asChild size="lg">
                  <a href={`/certificates/${certificate.id}`}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Certificate Page
                  </a>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Activities Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Activities</CardTitle>
          <CardDescription>
            Complete breakdown of all calculated emission activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {entries.map((entry, index) => (
              <div key={entry.id} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg">{entry.fuelType}</h4>
                      <Badge 
                        variant="default"
                        className={`text-xs ${entry.scope === 'Scope 1' ? 'bg-blue-600' : 'bg-green-600'}`}
                      >
                        {entry.scope}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">{entry.emissions.toFixed(2)} kg CO₂e</p>
                    <p className="text-sm text-muted-foreground">
                      {((entry.emissions / totalEmissions) * 100).toFixed(1)}% of total
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4 text-sm">
                  <div>
                    <label className="text-muted-foreground">Category:</label>
                    <p className="font-medium">{entry.category || 'Other'}</p>
                  </div>
                  {entry.equipmentType && (
                    <div>
                      <label className="text-muted-foreground">Equipment:</label>
                      <p className="font-medium">{entry.equipmentType}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-muted-foreground">Fuel Category:</label>
                    <p className="font-medium">{entry.fuelCategory}</p>
                  </div>
                  <div>
                    <label className="text-muted-foreground">Amount:</label>
                    <p className="font-medium">{entry.amount} {entry.unit_type}</p>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="grid gap-3 md:grid-cols-3 text-xs text-muted-foreground">
                    <div>
                      <span>Emission Factor: </span>
                      <span className="font-mono">{entry.convertedFactor.toFixed(6)} kg CO₂e/{entry.unit_type}</span>
                    </div>
                    <div>
                      <span>Calculated: </span>
                      <span>{new Date(entry.timestamp).toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span>Entry ID: </span>
                      <span className="font-mono">{entry.id.substring(0, 8)}...</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary Statistics */}
          <div className="mt-6 pt-6 border-t">
            <h4 className="font-medium mb-4">Calculation Summary</h4>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {entries.filter(e => e.scope === 'Scope 1').length}
                </div>
                <div className="text-sm text-blue-700 dark:text-blue-300">Scope 1 Activities</div>
                <div className="text-xs text-blue-600">
                  {(entries.filter(e => e.scope === 'Scope 1').reduce((sum, e) => sum + e.emissions, 0) / 1000).toFixed(2)} tonnes CO₂e
                </div>
              </div>
              <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {entries.filter(e => e.scope === 'Scope 2').length}
                </div>
                <div className="text-sm text-green-700 dark:text-green-300">Scope 2 Activities</div>
                <div className="text-xs text-green-600">
                  {(entries.filter(e => e.scope === 'Scope 2').reduce((sum, e) => sum + e.emissions, 0) / 1000).toFixed(2)} tonnes CO₂e
                </div>
              </div>
              <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {Object.keys(calculations.categoryBreakdown).length}
                </div>
                <div className="text-sm text-purple-700 dark:text-purple-300">Categories Used</div>
                <div className="text-xs text-purple-600">
                  {(totalEmissions / 1000).toFixed(2)} tonnes CO₂e total
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Organizational Details */}
      <Card>
        <CardHeader>
          <CardTitle>Assessment Details</CardTitle>
          <CardDescription>
            GHG assessment configuration and scope
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Organization</label>
                <p className="font-medium">{questionnaire.orgName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Boundary Approach</label>
                <p className="font-medium">{questionnaire.boundaryApproach}</p>
                {questionnaire.controlSubtype && (
                  <p className="text-sm text-muted-foreground">→ {questionnaire.controlSubtype}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Operational Boundary</label>
                <p className="font-medium">{questionnaire.operationalBoundary}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Emission Sources</label>
                <p className="font-medium">{questionnaire.emissionSources}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Total Activities</label>
                <p className="font-medium">{entries.length} calculations</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Assessment Date</label>
                <p className="font-medium">{format(new Date(questionnaire.timestamp), 'PPP')}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Emissions Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Emissions Breakdown</CardTitle>
          <CardDescription>
            Detailed breakdown included in your certificate
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(calculations.categoryBreakdown).map(([category, emissions]: [string, any]) => (
              <div key={category} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="font-medium">{category}</span>
                <span className="font-bold">{emissions.toFixed(2)} kg CO₂e</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrevious}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Results
        </Button>
        {certificate && (
          <Button asChild>
            <a href="/certificates">
              View All Certificates
            </a>
          </Button>
        )}
      </div>

      {copied && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg">
          Copied to clipboard!
        </div>
      )}
    </div>
  );
}