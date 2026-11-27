import {useCallback, useEffect, useRef} from 'react';
import {canLeaveDrafts} from '../utils/draftGuard.js';

const layers = [];
export function useBackLayer(onBack) {
  const current = useRef(onBack);
  current.current = onBack;
  useEffect(() => {
    if (!onBack) return;
    const layer = () => current.current?.();
    layers.push(layer);
    return () => { const index = layers.indexOf(layer); if (index >= 0) layers.splice(index, 1); };
  }, [!!onBack]);
}

// A single same-document entry consumes Back for app UI. Individual dialogs
// do not push entries, avoiding close/open races between nested dialogs.
export function useAppBack(initialTab, setTab) {
  const visited = useRef([initialTab]);
  const navigate = useCallback(next => {
    if (!canLeaveDrafts()) return;
    if (visited.current.at(-1) !== next) visited.current.push(next);
    setTab(next);
  }, [setTab]);
  useEffect(() => {
    let leaving = false;
    const hold = () => window.history.pushState({...window.history.state, ledgerBack: true}, '');
    if (!window.history.state?.ledgerBack) hold();
    const onPop = () => {
      if (leaving) return;
      const layer = layers.at(-1);
      if (layer) {hold();layer();return;}
      if (!canLeaveDrafts()) {hold();return;}
      if (visited.current.length > 1) {
        visited.current.pop(); hold(); setTab(visited.current.at(-1));
      } else {leaving = true; window.history.back();}
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [setTab]);
  return navigate;
}
