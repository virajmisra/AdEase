import ExtensionToggle from '../ExtensionToggle';
import { useState } from 'react';

export default function ExtensionToggleExample() {
  const [enabled, setEnabled] = useState(true);
  const [isActive, setIsActive] = useState(true);

  const handleToggle = (newEnabled: boolean) => {
    console.log('Extension toggled:', newEnabled);
    setEnabled(newEnabled);
    if (!newEnabled) {
      setIsActive(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <button
        onClick={() => setIsActive(!isActive)}
        className="px-3 py-1 text-sm bg-secondary text-secondary-foreground rounded hover-elevate"
        data-testid="button-toggle-active"
      >
        {isActive ? 'Make Inactive' : 'Make Active'}
      </button>
      
      <ExtensionToggle
        enabled={enabled}
        onToggle={handleToggle}
        isActive={isActive && enabled}
      />
    </div>
  );
}