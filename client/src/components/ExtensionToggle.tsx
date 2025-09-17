import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ExtensionToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  isActive?: boolean;
  className?: string;
}

export default function ExtensionToggle({ 
  enabled, 
  onToggle, 
  isActive = false,
  className 
}: ExtensionToggleProps) {
  return (
    <div className={cn("flex items-center justify-between", className)} data-testid="extension-toggle">
      <div className="space-y-1">
        <h3 className="text-base font-medium text-foreground">
          Ad Volume Reducer
        </h3>
        <div className="flex items-center gap-2">
          <Badge variant={enabled ? "default" : "secondary"}>
            {enabled ? "Enabled" : "Disabled"}
          </Badge>
          {enabled && isActive && (
            <Badge variant="outline" className="text-xs">
              Active
            </Badge>
          )}
        </div>
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