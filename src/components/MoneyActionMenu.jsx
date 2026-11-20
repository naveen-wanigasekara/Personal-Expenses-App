import { useEffect, useRef } from 'react';
import { MoreHorizontal } from 'lucide-react';

// Native disclosure keeps secondary actions keyboard accessible without a custom
// ARIA menu's arrow-key model. The panel closes on selection, Escape or outside input.
export default function MoneyActionMenu({ label, actions }) {
  const root = useRef(null), list = useRef(null);
  useEffect(() => {
    const outside = event => { if (!root.current?.contains(event.target) && root.current) root.current.open = false; };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, []);
  return <details className="lending-action-menu" ref={root}
    onToggle={event => { if (event.currentTarget.open) list.current?.scrollIntoView?.({ block: 'nearest' }); }}
    onBlur={event => { if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) event.currentTarget.open = false; }}
    onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); root.current.open = false; root.current.querySelector('summary').focus(); } }}>
    <summary className="tx-edit lending-menu-trigger" aria-label={label}><MoreHorizontal size={16} aria-hidden="true" /><span>{label === 'Manage borrower' ? label : 'Actions'}</span></summary>
    <div className="lending-action-list" ref={list}>
      {actions.filter(Boolean).map(({ label: text, icon: Icon, danger, disabled, onSelect }) => <button key={text} type="button" className={`lending-menu-item ${danger ? 'danger' : ''}`} disabled={disabled} onClick={() => { root.current.open = false; onSelect(); }}>{Icon && <Icon size={15} aria-hidden="true" />}{text}</button>)}
    </div>
  </details>;
}
