'use client';

import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Shield, Info, Lock } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface PrivacyToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  label?: string;
  description?: string;
  showDetails?: boolean;
}

export function PrivacyToggle({
  enabled,
  onToggle,
  label = 'Private Mode',
  description = 'Encrypt sensitive data using Arcium MPC',
  showDetails = true,
}: PrivacyToggleProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between p-4 border rounded-lg bg-purple-50/50 hover:bg-purple-50 transition-colors">
        <div className="flex items-center gap-3 flex-1">
          <Shield
            className={`h-5 w-5 ${
              enabled ? 'text-purple-600' : 'text-gray-400'
            }`}
          />
          <div className="space-y-0.5 flex-1">
            <div className="flex items-center gap-2">
              <Label className="text-base cursor-pointer" htmlFor="privacy-toggle">
                {label}
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-sm">
                      When enabled, sensitive data is encrypted using Multi-Party
                      Computation (MPC) and stored on Arcium's network. Only
                      authorized parties can decrypt it.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          <Switch
            id="privacy-toggle"
            checked={enabled}
            onCheckedChange={onToggle}
          />
        </div>
      </div>

      {enabled && showDetails && (
        <div className="p-3 bg-white rounded border border-purple-200 space-y-2">
          <div className="flex items-start gap-2">
            <Lock className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-1 text-xs text-muted-foreground">
              <p className="font-medium text-purple-900">
                What gets encrypted:
              </p>
              <ul className="list-disc list-inside space-y-0.5 ml-2">
                <li>Detailed breakdown data</li>
                <li>Sensitive scores and metrics</li>
                <li>Individual data points</li>
              </ul>
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <Shield className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-1 text-xs text-muted-foreground">
              <p className="font-medium text-green-900">
                What stays public:
              </p>
              <ul className="list-disc list-inside space-y-0.5 ml-2">
                <li>Total/summary values (for verification)</li>
                <li>Organization name</li>
                <li>Certificate/report ID</li>
                <li>Timestamps</li>
              </ul>
            </div>
          </div>

          <div className="pt-2 border-t border-purple-100">
            <p className="text-xs text-purple-700 flex items-center gap-1">
              <Info className="h-3 w-3" />
              <span>
                NFTs and audit logs still created (with encrypted data references)
              </span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
