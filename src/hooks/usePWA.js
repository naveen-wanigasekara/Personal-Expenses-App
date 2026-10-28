import { useEffect, useState } from "react";
import { activateAppUpdate } from "../utils/pwaUpdate.js";

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

    let disposed = false;
    let activeRegistration;
    let watchedWorker;
    let onWorkerStateChange;
    const checkForUpdates = () => {
      if (!document.hidden) activeRegistration?.update().catch(() => {});
    };
    const onUpdateFound = () => {
      watchedWorker?.removeEventListener("statechange", onWorkerStateChange);
      watchedWorker = activeRegistration.installing;
      if (!watchedWorker) return;
      onWorkerStateChange = () => {
        if (watchedWorker.state === "installed" && navigator.serviceWorker.controller) setNeedsRefresh(true);
      };
      watchedWorker.addEventListener("statechange", onWorkerStateChange);
    };
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        if (disposed) return;
        activeRegistration = reg;
        setRegistration(reg);

        // If a waiting worker already exists, prompt to refresh
        if (reg.waiting) setNeedsRefresh(true);

        // Watch for new updates
        reg.addEventListener("updatefound", onUpdateFound);
        window.addEventListener("focus", checkForUpdates);
        document.addEventListener("visibilitychange", checkForUpdates);
        checkForUpdates();
      }).catch(() => {});

      navigator.serviceWorker.addEventListener(
        "controllerchange",
        onControllerChange,
      );
    }

    return () => {
      disposed = true;
      activeRegistration?.removeEventListener("updatefound", onUpdateFound);
      watchedWorker?.removeEventListener("statechange", onWorkerStateChange);
      window.removeEventListener("focus", checkForUpdates);
      document.removeEventListener("visibilitychange", checkForUpdates);
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

  const updateApp = async () => {
    try {
      const reg = registration || ("serviceWorker" in navigator ? await navigator.serviceWorker.getRegistration() : null);
      await activateAppUpdate(reg);
    } catch {
      // A normal reload remains available if the update check is offline.
    }
    window.location.reload();
  };

  return {
    canInstall: !!installEvent && !isStandalone,
    install,
    isStandalone,
    needsRefresh,
    updateApp,
  };
}
