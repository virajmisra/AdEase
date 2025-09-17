import { Slider } from "@/components/ui/slider";
import { Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DetectionStatus } from "./StatusIndicator";

interface VolumeControlProps {
  originalVolume: number;
  reducedVolume: number;
  isReduced: boolean;
  detectionStatus: DetectionStatus;
  onOriginalVolumeChange: (volume: number[]) => void;
  onReducedVolumeChange: (volume: number[]) => void;
  className?: string;
}

export default function VolumeControl({
  originalVolume,
  reducedVolume,
  isReduced,
  detectionStatus,
  onOriginalVolumeChange,
  onReducedVolumeChange,
  className
}: VolumeControlProps) {
  
  // Determine colors based on detection status
  const getVolumeBarColor = () => {
    if (detectionStatus === 'program') return 'bg-success';
    if (detectionStatus === 'ad') return 'bg-warning';
    return 'bg-muted';
  };
  
  const getIconColor = () => {
    if (detectionStatus === 'program') return 'text-success';
    if (detectionStatus === 'ad') return 'text-warning';
    return isReduced ? 'text-warning' : 'text-success';
  };
  
  const getOriginalSliderStyle = () => {
    return detectionStatus === 'program' ? 'slider-success' : '';
  };
  
  const getAdSliderStyle = () => {
    return detectionStatus === 'ad' ? 'slider-warning' : '';
  };
  return (
    <div className={cn("space-y-4", className)} data-testid="volume-control">
      {/* Current Volume Visualization */}
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 flex items-center justify-center">
          {isReduced ? (
            <VolumeX className={cn("w-4 h-4", getIconColor())} />
          ) : (
            <Volume2 className={cn("w-4 h-4", getIconColor())} />
          )}
        </div>
        <div className="flex-1">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full transition-all duration-300 rounded-full",
                getVolumeBarColor()
              )}
              style={{ width: `${isReduced ? reducedVolume : originalVolume}%` }}
            />
          </div>
        </div>
        <span className="text-sm text-muted-foreground min-w-[3rem] text-right">
          {Math.round(isReduced ? reducedVolume : originalVolume)}%
        </span>
      </div>

      {/* Original Volume Control */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Normal Volume
        </label>
        <p className="text-xs text-muted-foreground">
          Your regular video volume level during program content.
        </p>
        <div className="flex items-center gap-3">
          <Volume2 className="w-4 h-4 text-muted-foreground" />
          <Slider
            value={[originalVolume]}
            onValueChange={onOriginalVolumeChange}
            max={100}
            min={0}
            step={1}
            className={cn("flex-1", getOriginalSliderStyle())}
            data-testid="slider-original-volume"
          />
          <span className="text-sm text-muted-foreground min-w-[3rem] text-right">
            {originalVolume}%
          </span>
        </div>
      </div>

      {/* Reduced Volume Control */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Ad Volume
        </label>
        <p className="text-xs text-muted-foreground">
          Your set volume when ads are detected.
        </p>
        <div className="flex items-center gap-3">
          <VolumeX className="w-4 h-4 text-muted-foreground" />
          <Slider
            value={[reducedVolume]}
            onValueChange={onReducedVolumeChange}
            max={100}
            min={0}
            step={1}
            className={cn("flex-1", getAdSliderStyle())}
            data-testid="slider-reduced-volume"
          />
          <span className="text-sm text-muted-foreground min-w-[3rem] text-right">
            {reducedVolume}%
          </span>
        </div>
      </div>
    </div>
  );
}