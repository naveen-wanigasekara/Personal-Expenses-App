import { useState } from "react";
import { RefreshCw, Download, X } from "lucide-react";
import { usePWA } from "../hooks/usePWA.js";

export default function PWABanners() {
  const { canInstall, install, needsRefresh, updateApp } = usePWA();
  const [dismissed, setDismissed] = useState(
    () => sessionStorage.getItem("install-dismissed") === "1"
  );

  const handleDismiss = () => {
    sessionStorage.setItem("install-dismissed", "1");
    setDismissed(true);
  };

  return (
    <>
      {needsRefresh && (
        <div className="pwa-banner update">
          <RefreshCw size={14} />
          <span>A new version is available</span>
          <button onClick={updateApp}>Refresh</button>
        </div>
      )}
      {canInstall && !dismissed && !needsRefresh && (
        <div className="pwa-banner install">
          <Download size={14} />
          <span>Install Ledger to your home screen</span>
          <button onClick={install}>Install</button>
          <button className="pwa-x" onClick={handleDismiss} aria-label="Dismiss">
            <X size={14} />
          </button>
        </div>
      )}
    </>
  );
}
