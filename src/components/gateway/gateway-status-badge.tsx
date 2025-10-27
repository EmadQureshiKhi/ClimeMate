'use client';

import { Badge } from '@/components/ui/badge';
import { Zap } from 'lucide-react';

export function GatewayStatusBadge() {
  const isGatewayEnabled = process.env.NEXT_PUBLIC_USE_GATEWAY === 'true';

  if (!isGatewayEnabled) {
    return null;
  }

  return (
    <Badge 
      variant="outline" 
      className="gap-1 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/20 text-purple-700 dark:text-purple-300"
      title="Sanctum Gateway: Optimized transaction delivery with dual routing (RPC + Jito), automatic tip refunds, and cost savings"
    >
      <Zap className="h-3 w-3" />
      Gateway Optimized
    </Badge>
  );
}
