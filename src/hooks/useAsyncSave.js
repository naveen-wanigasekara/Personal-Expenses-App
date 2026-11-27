import { useEffect, useRef, useState } from 'react';

// Prevent duplicate writes and keep the dialog open until its save settles.
export function useAsyncSave() {
  const lock = useRef(false);
  const mounted = useRef(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const runSave = async action => {
    if (lock.current) return;
    if (navigator.onLine === false) {setSaveError('Offline. Reconnect to save; your draft is still on this screen.');return;}
    lock.current = true;
    setSaving(true); setSaveError('');
    try { await action(); }
    catch (error) { if (mounted.current) setSaveError(error.message || 'Could not save. Please try again.'); }
    finally { lock.current = false; if (mounted.current) setSaving(false); }
  };
  return { saving, saveError, runSave };
}
