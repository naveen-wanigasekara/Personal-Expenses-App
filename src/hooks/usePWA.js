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

    // Listen for service worker updates. `serviceWorker.ready` (rather than
    // a one-shot getRegistration()) waits until a registration actually
    // exists, so this doesn't silently no-op if this effect runs before
    // vite-plugin-pwa's registration call has resolved.
    let refreshing = false;
    const onControllerChange = () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    };

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
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

      navigator.serviceWorker.addEventListener(
        "controllerchange",
        onControllerChange,
      );
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.removeEventListener(
          "controllerchange",
          onControllerChange,
        );
      }
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
