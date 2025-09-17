import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

import ExtensionToggle from "./ExtensionToggle";
import StatusIndicator, { type DetectionStatus } from "./StatusIndicator";
import VolumeControl from "./VolumeControl";
import ModelStatus, { type ModelState } from "./ModelStatus";
import SettingsPanel from "./SettingsPanel";

interface ExtensionPopupProps {
  className?: string;
}

export default function ExtensionPopup({ className }: ExtensionPopupProps) {
  // Extension state
  const [extensionEnabled, setExtensionEnabled] = useState(true);
  const [detectionStatus, setDetectionStatus] = useState<DetectionStatus>('program');
  const [modelState, setModelState] = useState<ModelState>('ready');
  
  // Volume state
  const [originalVolume, setOriginalVolume] = useState(75);
  const [reducedVolume, setReducedVolume] = useState(25);
  
  // Settings state
  const [sensitivity, setSensitivity] = useState(70);
  const [autoAdjust, setAutoAdjust] = useState(true);
  const [fadeTransitions, setFadeTransitions] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  const handleExtensionToggle = (enabled: boolean) => {
    console.log('Extension toggled:', enabled);
    setExtensionEnabled(enabled);
    if (!enabled) {
      setDetectionStatus('idle');
    } else {
      setDetectionStatus('program');
    }
  };

  const handleResetSettings = () => {
    console.log('Resetting settings');
    setSensitivity(50);
    setAutoAdjust(true);
    setFadeTransitions(true);
  };

  // Simulate detection status changes for demo
  const simulateDetection = (status: DetectionStatus) => {
    console.log('Simulating detection:', status);
    setDetectionStatus(status);
  };

  const isActive = extensionEnabled && detectionStatus !== 'idle';
  const isVolumeReduced = detectionStatus === 'ad';

  return (
    <Card className={cn("w-80 shadow-lg", className)} data-testid="extension-popup">
      <CardHeader className="pb-4">
        <ExtensionToggle
          enabled={extensionEnabled}
          onToggle={handleExtensionToggle}
          isActive={isActive}
        />
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Current Status */}
        {extensionEnabled && (
          <>
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-foreground">Current Status</h4>
              <StatusIndicator status={detectionStatus} />
            </div>

            {/* Demo Controls - todo: remove mock functionality */}
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => simulateDetection('program')}
                className="text-xs"
                data-testid="button-simulate-program"
              >
                Program
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => simulateDetection('ad')}
                className="text-xs"
                data-testid="button-simulate-ad"
              >
                Ad
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => simulateDetection('processing')}
                className="text-xs"
                data-testid="button-simulate-processing"
              >
                Processing
              </Button>
            </div>

            <Separator />

            {/* Volume Control */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-foreground">Volume Control</h4>
              <VolumeControl
                originalVolume={originalVolume}
                reducedVolume={reducedVolume}
                isReduced={isVolumeReduced}
                onOriginalVolumeChange={(value) => setOriginalVolume(value[0])}
                onReducedVolumeChange={(value) => setReducedVolume(value[0])}
              />
            </div>

            <Separator />

            {/* Model Status */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-foreground">ML Model</h4>
              <ModelStatus
                state={modelState}
                lastUpdate={new Date(Date.now() - 5 * 60 * 1000)} // 5 min ago
                accuracy={0.89}
              />
            </div>

            {/* Settings Panel */}
            <Collapsible open={showSettings} onOpenChange={setShowSettings}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between p-0 h-auto"
                  data-testid="button-toggle-settings"
                >
                  <span className="text-sm font-medium">Advanced Settings</span>
                  {showSettings ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="pt-4">
                <SettingsPanel
                  sensitivity={sensitivity}
                  onSensitivityChange={(value) => setSensitivity(value[0])}
                  autoAdjust={autoAdjust}
                  onAutoAdjustChange={setAutoAdjust}
                  fadeTransitions={fadeTransitions}
                  onFadeTransitionsChange={setFadeTransitions}
                  onReset={handleResetSettings}
                />
              </CollapsibleContent>
            </Collapsible>
          </>
        )}

        {/* Disabled State */}
        {!extensionEnabled && (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">
              Enable the extension to start detecting ads
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}