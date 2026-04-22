import { useEffect, useState } from "react";

/**
 * Hook to manage the PWA install prompt and update notifications.
 *
 * Returns:
 *   - canInstall: true if browser supports install AND app isn't already installed
 *   - install: function to trigger the install prompt
 *   - isStandalone: true when running as installed PWA
 *   - needsRefresh: true when a new service worker has been installed
 *   - updateApp: function to activate the new service worker and reload
 */
export function usePWA() {
  const [installEvent, setInstallEvent] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [needsRefresh, setNeedsRefresh] = useState(false);
  const [registration, setRegistration] = useState(null);

  useEffect(() => {
    // Detect standalone (already installed)
    const checkStandalone = () => {
      const standalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        window.navigator.standalone === true;
      setIsStandalone(standalone);
    };
    checkStandalone();

    // Capture the install prompt
    const onBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setInstallEvent(e);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);

    // Detect successful install
    const onInstalled = () => {
      setInstallEvent(null);
      setIsStandalone(true);
    };
    window.addEventListener("appinstalled", onInstalled);

    // Listen for service worker updates
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (!reg) return;
        setRegistration(reg);

        // If a waiting worker already exists, prompt to refresh
        if (reg.waiting) setNeedsRefresh(true);

        // Watch for new updates
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              setNeedsRefresh(true);
            }
          });
        });
      });

      // Reload page when the new SW takes control
      let refreshing = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (refreshing) return;
        refreshing = true;
        window.location.reload();
      });
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = async () => {
    if (!installEvent) return false;
    installEvent.prompt();
    const { outcome } = await installEvent.userChoice;
    setInstallEvent(null);
    return outcome === "accepted";
  };

  const updateApp = () => {
    if (!registration?.waiting) {
      window.location.reload();
      return;
    }
    registration.waiting.postMessage({ type: "SKIP_WAITING" });
  };

  return {
    canInstall: !!installEvent && !isStandalone,
    install,
    isStandalone,
    needsRefresh,
    updateApp,
  };
}
