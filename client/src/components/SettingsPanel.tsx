import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Settings, RotateCcw, Brain, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SettingsPanelProps {
  sensitivity: number;
  onSensitivityChange: (value: number[]) => void;
  autoAdjust: boolean;
  onAutoAdjustChange: (enabled: boolean) => void;
  fadeTransitions: boolean;
  onFadeTransitionsChange: (enabled: boolean) => void;
  onReset: () => void;
  className?: string;
}

export default function SettingsPanel({
  sensitivity,
  onSensitivityChange,
  autoAdjust,
  onAutoAdjustChange,
  fadeTransitions,
  onFadeTransitionsChange,
  onReset,
  className
}: SettingsPanelProps) {
  return (
    <Card className={cn("w-full max-w-sm", className)} data-testid="settings-panel">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4" />
          <CardTitle className="text-base">Settings</CardTitle>
        </div>
        <CardDescription className="text-sm">
          Customize ad detection and volume control
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Detection Sensitivity */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-muted-foreground" />
              <label className="text-sm font-medium">Detection Sensitivity</label>
            </div>
            <Badge variant="outline" className="text-xs">
              {sensitivity}%
            </Badge>
          </div>
          
          <p className="text-xs text-muted-foreground">
            How quickly the extension responds to potential ads. Higher values detect ads faster but may have false positives.
          </p>
          
          <Slider
            value={[sensitivity]}
            onValueChange={onSensitivityChange}
            max={100}
            min={10}
            step={1}
            className="w-full"
            data-testid="slider-sensitivity"
          />
          
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Conservative</span>
            <span>Aggressive</span>
          </div>
        </div>

        <Separator />

        {/* Volume Controls */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-muted-foreground" />
            <h4 className="text-sm font-medium">Volume Controls</h4>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm">Auto-adjust volume</label>
                <Switch
                  checked={autoAdjust}
                  onCheckedChange={onAutoAdjustChange}
                  data-testid="switch-auto-adjust"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Automatically lower volume when ads are detected and restore when they end.
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm">Smooth transitions</label>
                <Switch
                  checked={fadeTransitions}
                  onCheckedChange={onFadeTransitionsChange}
                  data-testid="switch-fade-transitions"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Gradually fade volume changes instead of instant adjustments for a smoother experience.
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Reset Settings */}
        <Button
          variant="outline"
          size="sm"
          onClick={onReset}
          className="w-full flex items-center gap-2"
          data-testid="button-reset-settings"
        >
          <RotateCcw className="w-4 h-4" />
          Reset to Defaults
        </Button>
      </CardContent>
    </Card>
  );
}