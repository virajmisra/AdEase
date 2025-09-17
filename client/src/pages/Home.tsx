import ExtensionPopup from "@/components/ExtensionPopup";
import ThemeToggle from "@/components/ThemeToggle";

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              Ad Volume Reducer
            </h1>
            <p className="text-sm text-muted-foreground">
              Chrome Extension Prototype
            </p>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <ExtensionPopup />
          
          {/* Prototype Info */}
          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              This is a prototype of the Chrome extension popup interface.
            </p>
            <p className="text-xs text-muted-foreground">
              The actual extension would detect ads in real-time using a trained ML model.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}