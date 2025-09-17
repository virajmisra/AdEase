import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle, Loader2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type ModelState = 'loading' | 'ready' | 'error' | 'offline';

interface ModelStatusProps {
  state: ModelState;
  lastUpdate?: Date;
  accuracy?: number;
  className?: string;
}

const stateConfig = {
  loading: {
    icon: Loader2,
    label: 'Loading Model',
    variant: 'secondary' as const,
    iconClass: 'animate-spin text-muted-foreground'
  },
  ready: {
    icon: CheckCircle,
    label: 'Model Ready',
    variant: 'default' as const,
    iconClass: 'text-success'
  },
  error: {
    icon: AlertCircle,
    label: 'Model Error',
    variant: 'destructive' as const,
    iconClass: 'text-destructive'
  },
  offline: {
    icon: XCircle,
    label: 'Offline',
    variant: 'outline' as const,
    iconClass: 'text-muted-foreground'
  }
};

export default function ModelStatus({ state, lastUpdate, accuracy, className }: ModelStatusProps) {
  const config = stateConfig[state];
  const Icon = config.icon;
  
  return (
    <div className={cn("space-y-2", className)} data-testid={`model-status-${state}`}>
      <div className="flex items-center justify-between">
        <Badge variant={config.variant} className="flex items-center gap-2">
          <Icon className={cn("w-3 h-3", config.iconClass)} />
          <span className="text-xs">{config.label}</span>
        </Badge>
        
        {accuracy && state === 'ready' && (
          <Badge variant="outline" className="text-xs">
            {Math.round(accuracy * 100)}% accurate
          </Badge>
        )}
      </div>
      
      {lastUpdate && state === 'ready' && (
        <p className="text-xs text-muted-foreground">
          Updated {formatTimeAgo(lastUpdate)}
        </p>
      )}
      
      {state === 'error' && (
        <p className="text-xs text-destructive">
          Failed to load ML model. Please refresh the page.
        </p>
      )}
    </div>
  );
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  
  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}