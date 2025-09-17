import StatusIndicator from '../StatusIndicator';

export default function StatusIndicatorExample() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <StatusIndicator status="program" />
      <StatusIndicator status="ad" />
      <StatusIndicator status="processing" />
      <StatusIndicator status="idle" />
    </div>
  );
}