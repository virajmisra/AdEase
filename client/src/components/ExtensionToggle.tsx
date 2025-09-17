import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface ExtensionToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  className?: string;
}

export default function ExtensionToggle({ 
  enabled, 
  onToggle, 
  className 
}: ExtensionToggleProps) {
  return (
    <div className={cn("flex items-center justify-between", className)} data-testid="extension-toggle">
      <div>
        <h3 className="text-base font-medium text-foreground">
          Ad Volume Reducer
        </h3>
        <p className="text-sm text-muted-foreground">
          {enabled ? "Auto-adjusting volume when ads are detected" : "Click to enable ad detection"}
        </p>
      </div>
      
      <Switch
        checked={enabled}
        onCheckedChange={onToggle}
        className="data-[state=checked]:bg-primary"
        data-testid="switch-extension"
      />
    </div>
  );
}