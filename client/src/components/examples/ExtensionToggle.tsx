import ExtensionToggle from '../ExtensionToggle';
import { useState } from 'react';

export default function ExtensionToggleExample() {
  const [enabled, setEnabled] = useState(true);

  const handleToggle = (newEnabled: boolean) => {
    console.log('Extension toggled:', newEnabled);
    setEnabled(newEnabled);
  };

  return (
    <div className="p-4">
      <ExtensionToggle
        enabled={enabled}
        onToggle={handleToggle}
      />
    </div>
  );
}