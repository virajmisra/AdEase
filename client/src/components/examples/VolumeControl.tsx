import VolumeControl from '../VolumeControl';
import { useState } from 'react';

export default function VolumeControlExample() {
  const [originalVolume, setOriginalVolume] = useState(75);
  const [reducedVolume, setReducedVolume] = useState(25);
  const [isReduced, setIsReduced] = useState(false);

  return (
    <div className="p-4 space-y-4">
      <button
        onClick={() => setIsReduced(!isReduced)}
        className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded hover-elevate"
        data-testid="button-toggle-reduction"
      >
        {isReduced ? 'Show Normal' : 'Show Reduced'}
      </button>
      
      <VolumeControl
        originalVolume={originalVolume}
        reducedVolume={reducedVolume}
        isReduced={isReduced}
        detectionStatus={isReduced ? 'ad' : 'program'}
        onOriginalVolumeChange={(value) => setOriginalVolume(value[0])}
        onReducedVolumeChange={(value) => setReducedVolume(value[0])}
      />
    </div>
  );
}