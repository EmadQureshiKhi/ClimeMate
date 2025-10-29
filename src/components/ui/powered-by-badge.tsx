import { ExternalLink } from 'lucide-react';

interface PoweredByBadgeProps {
  className?: string;
}

export function PoweredByBadge({ className = '' }: PoweredByBadgeProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-sm text-muted-foreground">Powered by</span>
      <a
        href="https://decharge.io"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
      >
        DeCharge Network
        <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  );
}
