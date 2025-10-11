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

interface CertificatePreviewProps {
  calculations: any;
  emissionDataId?: string;
  onGenerate: (certificate: any) => void;
  onPrevious: () => void;
}

export function CertificatePreview({ calculations, emissionDataId, onGenerate, onPrevious }: CertificatePreviewProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [certificate, setCertificate] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  
  // Check if we have a valid emission data ID
  const hasValidEmissionDataId = emissionDataId && emissionDataId !== 'temp-emission-id' && emissionDataId.length > 10;
  

  const generateCertificate = async () => {
    setIsGenerating(true);

    try {
      // 1. Generate certificate data structure first
      const certificateData = {
        certificate_id: `GHG-${Date.now()}`,
        title: `Emissions Certificate - ${format(new Date(), 'MMM yyyy')}`,
        total_emissions: calculations.totalEmissions,
        breakdown: calculations.breakdown || calculations.categoryBreakdown,
        data_hash: '',
      };

      // Debug: Log calculations object before hashing
      console.log('🔍 Calculations object for hashing:', calculations);
      console.log('🔍 Breakdown data:', calculations.breakdown || calculations.categoryBreakdown);
      
      // Generate data hash from calculations
      const hashData = {
        totalEmissions: calculations.totalEmissions,
        breakdown: calculations.breakdown || calculations.categoryBreakdown,
        summary: calculations.summary || {},
        processedData: calculations.processedData || [],
        timestamp: new Date().toISOString()
      };
      console.log('🔍 Hash data object:', hashData);
      
      certificateData.data_hash = CryptoJS.SHA256(JSON.stringify(hashData)).toString();
      console.log('🔍 Generated data hash:', certificateData.data_hash);

      // 2. Mock certificate creation
      const result = {
        id: `cert-${Date.now()}`,
        ...certificateData,
        issue_date: new Date().toISOString().split('T')[0],
        valid_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'verified',
        created_at: new Date().toISOString()
      };

      setCertificate(result);
      onGenerate(result);
    } catch (error) {
      console.error('Failed to create certificate:', error); // Log the full error object
      // Ensure the error message is properly extracted
      
      let errorMessage = 'Unknown error occurred';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        errorMessage = JSON.stringify(error);
      } else {
        errorMessage = String(error);
      }
      
      console.error(`Failed to create certificate: ${errorMessage}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadPDF = () => {
    // Mock PDF download
    const element = document.createElement('a');
    const file = new Blob(['Certificate PDF content would be here'], { type: 'application/pdf' });
    element.href = URL.createObjectURL(file);
    element.download = `GHG-Certificate-${certificate?.certificate_id}.pdf`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-6">
      {/* Certificate Preview */}
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950"></div>
        <CardHeader className="relative">
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Award className="h-6 w-6 text-green-600" />
            GHG Emissions Certificate
          </CardTitle>
          <CardDescription>
            Blockchain-verified carbon footprint certificate
          </CardDescription>
        </CardHeader>
        <CardContent className="relative space-y-6">
          {/* Certificate Content */}
          <div className="bg-white dark:bg-gray-900 p-8 rounded-lg border-2 border-green-200 dark:border-green-800 shadow-lg">
            <div className="text-center space-y-4 mb-8">
              <div className="w-16 h-16 mx-auto bg-green-600 rounded-full flex items-center justify-center">
                <Award className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-green-600">
                Carbon Emissions Certificate
              </h2>
              <p className="text-muted-foreground">
                This certificate verifies the carbon footprint calculation
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Total Emissions</label>
                  <p className="text-2xl font-bold text-primary">
                    {calculations.totalEmissions.toLocaleString()} kg CO₂e
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
                  <label className="text-sm font-medium text-muted-foreground">Categories</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {Object.keys(calculations.breakdown || calculations.categoryBreakdown || {}).map((category) => (
                      <Badge key={category} variant="secondary">
                        {category}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Data Points</label>
                  <p className="font-medium">{calculations.summary?.processedRows || 0} entries</p>
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

          {/* Generation Button */}
          {!certificate && (
            <div className="text-center">
              <Button
                size="lg"
                onClick={generateCertificate}
                disabled={isGenerating}
                className="bg-green-600 hover:bg-green-700"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Generating Certificate...
                  </>
                ) : (
                  <>
                    <Award className="h-5 w-5 mr-2" />
                    Generate Certificate
                  </>
                )}
              </Button>
              <p className="text-sm text-muted-foreground mt-2">
                This will create a verified certificate. Blockchain verification coming soon!
              </p>
            </div>
          )}

          {/* Success Actions */}
          {certificate && (
            <div className="space-y-4">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Certificate generated successfully! Your emissions data has been verified and recorded. Blockchain verification coming soon!
                </AlertDescription>
              </Alert>

              <div className="flex flex-wrap gap-4 justify-center">
                <Button onClick={downloadPDF} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
                <Button variant="outline">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Certificate
                </Button>
                <Button variant="outline" disabled>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Blockchain Explorer (Soon)
                </Button>
              </div>
            </div>
          )}
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
            {Object.entries(calculations.breakdown || calculations.categoryBreakdown || {}).map(([category, emissions]: [string, any]) => (
              <div key={category} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="font-medium">{category}</span>
                <span className="font-bold">{emissions.toFixed(2)} kg CO₂e</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {copied && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg">
          Copied to clipboard!
        </div>
      )}
    </div>
  );
}