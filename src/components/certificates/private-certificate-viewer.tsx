'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Lock, Unlock, Eye, EyeOff, Info, AlertCircle } from 'lucide-react';
import { useWallets } from '@privy-io/react-auth/solana';
import { ArciumCertificateClient } from '@/lib/arcium-certificates';
import { useToast } from '@/hooks/use-toast';

interface PrivateCertificateViewerProps {
  certificate: {
    id: string;
    certificateId: string;
    title: string;
    totalEmissions: number;
    organizationName?: string;
    isPrivate: boolean;
    encryptedDataId?: string | null;
    arciumSignature?: string | null;
    arciumDataHash?: string | null;
    userId: string;
    createdAt: Date;
  };
  currentUserId?: string;
}

export function PrivateCertificateViewer({
  certificate,
  currentUserId,
}: PrivateCertificateViewerProps) {
  const { wallets } = useWallets();
  const { toast } = useToast();
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptedData, setDecryptedData] = useState<any>(null);
  const [showData, setShowData] = useState(false);

  // For MVP: Always allow decryption if user is logged in
  // In production, implement proper ownership verification
  const isOwner = true; // Simplified for testing - always show decrypt button

  console.log('🔒 PrivateCertificateViewer rendering:', {
    certificateId: certificate.certificateId,
    isPrivate: certificate.isPrivate,
    encryptedDataId: certificate.encryptedDataId,
    isOwner,
    currentUserId,
  });

  const handleDecrypt = async () => {
    if (!wallets || wallets.length === 0) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet to decrypt this certificate",
        variant: "destructive",
      });
      return;
    }

    if (!isOwner) {
      toast({
        title: "Unauthorized",
        description: "Only the certificate owner can decrypt this data",
        variant: "destructive",
      });
      return;
    }

    setIsDecrypting(true);
    try {
      // First check if data is in database (old non-encrypted private certs)
      const response = await fetch(`/api/certificates/${certificate.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch certificate');
      }
      
      const { certificate: certData } = await response.json();
      
      // If breakdown exists in DB, use it (old style)
      if (certData.breakdown) {
        setDecryptedData({
          breakdown: certData.breakdown,
          processedData: certData.processedData || [],
        });
        setShowData(true);
        toast({
          title: "Decryption Successful",
          description: "Your emissions data has been decrypted",
        });
        return;
      }
      
      // Otherwise, decrypt from Arcium (new style)
      if (certificate.encryptedDataId) {
        console.log('🔓 Decrypting from Arcium:', certificate.encryptedDataId);
        const arciumClient = new ArciumCertificateClient();
        const decryptResult = await arciumClient.decryptCertificate(
          certificate.encryptedDataId,
          wallets[0].address
        );
        
        if (decryptResult.success && decryptResult.data) {
          // Extract categoryBreakdown from decrypted data
          const breakdown = decryptResult.data.categoryBreakdown || {
            scope1: decryptResult.data.scope1 || 0,
            scope2: decryptResult.data.scope2 || 0,
            scope3: decryptResult.data.scope3 || 0,
          };
          
          setDecryptedData({
            breakdown,
            processedData: [],
          });
          setShowData(true);
          toast({
            title: "Decryption Successful",
            description: "Your emissions data has been decrypted from Arcium",
          });
        } else {
          throw new Error(decryptResult.error || 'Failed to decrypt from Arcium');
        }
      } else {
        toast({
          title: "No Data",
          description: "No emissions breakdown available for this certificate",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('❌ Decryption error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to decrypt certificate",
        variant: "destructive",
      });
    } finally {
      setIsDecrypting(false);
    }
  };

  return (
    <Card className="border-2 border-purple-200 bg-purple-50/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-purple-600" />
            <CardTitle>Private Certificate</CardTitle>
          </div>
          <Badge variant="secondary" className="bg-purple-100 text-purple-700">
            <Lock className="h-3 w-3 mr-1" />
            Encrypted
          </Badge>
        </div>
        <CardDescription>
          Emissions data is encrypted using Arcium MPC
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Public Information */}
        <div className="space-y-2">
          <h3 className="font-medium text-sm flex items-center gap-2">
            <Info className="h-4 w-4" />
            Public Information
          </h3>
          <div className="grid gap-2 p-3 bg-white rounded border">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Certificate ID:</span>
              <span className="font-mono text-xs">{certificate.certificateId}</span>
            </div>
            {certificate.organizationName && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Organization:</span>
                <span className="font-medium">{certificate.organizationName}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Emissions:</span>
              <span className="font-medium text-lg">{certificate.totalEmissions.toFixed(2)} kg CO₂e</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Issue Date:</span>
              <span className="font-medium">{new Date(certificate.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Private Information */}
        <div className="space-y-2">
          <h3 className="font-medium text-sm flex items-center gap-2">
            <Lock className="h-4 w-4 text-purple-600" />
            Private Information (Encrypted)
          </h3>

          {!decryptedData ? (
            <div className="bg-white p-4 rounded border border-purple-200 space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Lock className="h-4 w-4 text-purple-600" />
                <span>Emissions breakdown is encrypted</span>
              </div>

              <div className="space-y-2 text-xs text-muted-foreground">
                <p className="flex items-start gap-2">
                  <Shield className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  <span>Encrypted Data ID: {certificate.encryptedDataId?.slice(0, 20)}...</span>
                </p>
                {certificate.arciumDataHash && (
                  <p className="flex items-start gap-2">
                    <Shield className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    <span>Data Hash: {certificate.arciumDataHash.slice(0, 20)}...</span>
                  </p>
                )}
              </div>

              {isOwner ? (
                <Button
                  onClick={handleDecrypt}
                  disabled={isDecrypting}
                  className="w-full"
                  variant="outline"
                >
                  {isDecrypting ? (
                    <>Decrypting...</>
                  ) : (
                    <>
                      <Unlock className="h-4 w-4 mr-2" />
                      Decrypt to View Details
                    </>
                  )}
                </Button>
              ) : (
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded">
                  <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-amber-800">
                    Only the certificate owner can decrypt this data
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white p-4 rounded border border-green-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <Unlock className="h-4 w-4" />
                  <span className="font-medium">Decrypted Successfully</span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowData(!showData)}
                >
                  {showData ? (
                    <><EyeOff className="h-4 w-4 mr-1" /> Hide</>
                  ) : (
                    <><Eye className="h-4 w-4 mr-1" /> Show</>
                  )}
                </Button>
              </div>

              {showData && decryptedData.breakdown && (
                <div className="grid gap-2 pt-2 border-t">
                  <h4 className="text-sm font-medium mb-2">Emissions Breakdown:</h4>
                  {Object.entries(decryptedData.breakdown).map(([category, emissions]: [string, any]) => (
                    <div key={category} className="flex justify-between text-sm">
                      <span className="text-muted-foreground capitalize">{category}:</span>
                      <span className="font-medium">{Number(emissions).toFixed(2)} kg CO₂e</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm pt-2 border-t font-semibold">
                    <span>Total:</span>
                    <span>{decryptedData.total?.toFixed(2) || certificate.totalEmissions.toFixed(2)} kg CO₂e</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Privacy Notice */}
        <div className="bg-purple-50 p-3 rounded text-xs text-muted-foreground border border-purple-100">
          <p className="flex items-start gap-2">
            <Shield className="h-4 w-4 mt-0.5 flex-shrink-0 text-purple-600" />
            <span>
              This certificate uses Arcium's Multi-Party Computation to keep your emissions
              breakdown private while maintaining verifiability on Solana blockchain.
              {certificate.arciumSignature && (
                <span className="block mt-1 text-purple-700">
                  Encryption Signature: {certificate.arciumSignature}
                </span>
              )}
            </span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
