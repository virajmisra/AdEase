import SettingsPanel from '../SettingsPanel';
import { useState } from 'react';

export default function SettingsPanelExample() {
  const [sensitivity, setSensitivity] = useState(70);
  const [autoAdjust, setAutoAdjust] = useState(true);
  const [fadeTransitions, setFadeTransitions] = useState(true);

  const handleReset = () => {
    console.log('Resetting settings to defaults');
    setSensitivity(50);
    setAutoAdjust(true);
    setFadeTransitions(true);
  };

  const handleSensitivityChange = (value: number[]) => {
    console.log('Sensitivity changed to:', value[0]);
    setSensitivity(value[0]);
  };

  return (
    <div className="p-4">
      <SettingsPanel
        sensitivity={sensitivity}
        onSensitivityChange={handleSensitivityChange}
        autoAdjust={autoAdjust}
        onAutoAdjustChange={setAutoAdjust}
        fadeTransitions={fadeTransitions}
        onFadeTransitionsChange={setFadeTransitions}
        onReset={handleReset}
      />
    </div>
  );
}