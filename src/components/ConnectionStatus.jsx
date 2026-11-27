import {useEffect, useState} from 'react';

export default function ConnectionStatus() {
  const [online, setOnline] = useState(navigator.onLine !== false);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine !== false);
    window.addEventListener('online', update); window.addEventListener('offline', update);
    return () => {window.removeEventListener('online', update);window.removeEventListener('offline', update);};
  }, []);
  if (online) return null;
  return <div className="sync-status offline" role="status">Offline. Saved records need a connection. Unsaved entries are not queued; keep this screen open and reconnect before saving.</div>;
}
