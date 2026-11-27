import {useEffect, useRef} from 'react';
import {registerDraftGuard} from '../utils/draftGuard.js';
export function useDraftState(dirty, busy = false) {
  const state = useRef({dirty, busy});
  state.current = {dirty, busy};
  useEffect(() => {
    const release = registerDraftGuard({dirty:()=>state.current.dirty, busy:()=>state.current.busy});
    const prevent = event => {if (state.current.dirty || state.current.busy) {event.preventDefault();event.returnValue='';}};
    window.addEventListener('beforeunload', prevent);
    return () => {release();window.removeEventListener('beforeunload', prevent);};
  }, []);
}
