import { cn } from "@/lib/utils";
import { Play, VolumeX, Loader2 } from "lucide-react";

export type DetectionStatus = 'program' | 'ad' | 'processing' | 'idle';

interface StatusIndicatorProps {
  status: DetectionStatus;
  className?: string;
}

const statusConfig = {
  program: {
    color: 'bg-success',
    icon: Play,
    label: 'Program Content',
    pulse: false
  },
  ad: {
    color: 'bg-warning', 
    icon: VolumeX,
    label: 'Ad Detected',
    pulse: true
  },
  processing: {
    color: 'bg-processing',
    icon: Loader2,
    label: 'Processing...',
    pulse: false
  },
  idle: {
    color: 'bg-muted',
    icon: Play,
    label: 'Idle',
    pulse: false
  }
};

export default function StatusIndicator({ status, className }: StatusIndicatorProps) {
  const config = statusConfig[status];
  const Icon = config.icon;
  
  return (
    <div className={cn("flex items-center gap-3", className)} data-testid={`status-${status}`}>
      <div className="relative">
        <div 
          className={cn(
            "w-3 h-3 rounded-full flex items-center justify-center",
            config.color,
            config.pulse && "animate-pulse"
          )}
        >
          <Icon 
            className={cn(
              "w-2 h-2 text-white",
              status === 'processing' && "animate-spin"
            )} 
          />
        </div>
        {config.pulse && (
          <div className={cn(
            "absolute inset-0 w-3 h-3 rounded-full animate-ping opacity-30",
            config.color
          )} />
        )}
      </div>
      <span className="text-sm font-medium text-foreground">
        {config.label}
      </span>
    </div>
  );
}