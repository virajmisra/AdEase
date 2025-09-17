import ModelStatus from '../ModelStatus';

export default function ModelStatusExample() {
  // todo: remove mock functionality
  const mockLastUpdate = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
  
  return (
    <div className="flex flex-col gap-4 p-4">
      <ModelStatus state="loading" />
      <ModelStatus 
        state="ready" 
        lastUpdate={mockLastUpdate}
        accuracy={0.89}
      />
      <ModelStatus state="error" />
      <ModelStatus state="offline" />
    </div>
  );
}