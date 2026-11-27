import { useEffect, useRef, useId, useState } from "react";
import { createPortal } from "react-dom";
import { useBackLayer } from '../hooks/useAppBack.js';
import { X } from "lucide-react";
import { DISCARD_MESSAGE, registerDraftGuard } from '../utils/draftGuard.js';

const FOCUSABLE =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

// Some modals (e.g. CategoriesModal) render another Sheet nested inside
// themselves for add/edit forms. This stack ensures Escape only closes the
// topmost one — without it, every mounted Sheet's own document-level
// keydown listener would fire and close all of them at once.
let openStack = [];
let previousBodyOverflow = "";

// Shared chrome for all modals: a bottom sheet on mobile/tablet that becomes
// a centered dialog at desktop widths (see app.css RESPONSIVE section).
// Owns body-scroll-lock, Escape-to-close, and a basic focus trap so each
// modal doesn't have to reimplement them.
export default function Sheet({ title, onClose, children, className, portal = true, protectDraft = false, busy = false }) {
  const sheetRef = useRef(null);
  const backdropRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const dirty = useRef(false);
  const [offlineError, setOfflineError] = useState(false);
  const busyRef = useRef(busy);
  busyRef.current = busy;
  const isBusy = () => busyRef.current || !!sheetRef.current?.querySelector('fieldset[disabled]');
  const requestClose = () => {
    if (isBusy()) return;
    if (protectDraft && dirty.current && !window.confirm(DISCARD_MESSAGE)) return;
    onClose();
  };
  onCloseRef.current = requestClose;
  useBackLayer(() => onCloseRef.current());
  useEffect(() => {
    if (!protectDraft) return;
    const unregister = registerDraftGuard({dirty: () => dirty.current, busy: isBusy});
    const beforeUnload = event => { if (dirty.current || isBusy()) {event.preventDefault();event.returnValue = '';} };
    window.addEventListener('beforeunload', beforeUnload);
    return () => {unregister();window.removeEventListener('beforeunload', beforeUnload);};
  }, [protectDraft]);
  const idRef = useRef(null);
  if (idRef.current === null) idRef.current = Symbol("sheet");
  const titleId = useId();

  useEffect(() => {
    // iOS keeps the layout viewport tall while its keyboard covers part of
    // the screen. Use the visible viewport for ordinary sheets. The bank
    // form already owns a viewport-aware portal and opts out below.
    const viewport = window.visualViewport;
    if (!portal || !viewport) return;
    const fit = () => {
      const layer = backdropRef.current;
      if (!layer || viewport.scale !== 1) return;
      layer.style.top = `${viewport.offsetTop}px`;
      layer.style.height = `${viewport.height}px`;
      layer.style.bottom = "auto";
      layer.style.setProperty("--sheet-viewport-height", `${viewport.height}px`);
    };
    fit();
    viewport.addEventListener("resize", fit);
    viewport.addEventListener("scroll", fit);
    return () => {
      viewport.removeEventListener("resize", fit);
      viewport.removeEventListener("scroll", fit);
    };
  }, [portal]);

  useEffect(() => {
    const sheet = sheetRef.current;
    const id = idRef.current;
    if (!openStack.length) previousBodyOverflow = document.body.style.overflow;
    const parent = openStack[openStack.length - 1];
    // React autoFocus can run before this effect. In that case the active
    // element is already in the child, so restore the parent's last control.
    const active = document.activeElement;
    const previouslyFocused = sheet.contains(active) ? parent?.lastFocused : active;
    const entry = { id, lastFocused: null };
    openStack.push(entry);
    const handleFocus = (e) => {
      if (e.target.closest?.('[role="dialog"]') === sheet) entry.lastFocused = e.target;
    };
    document.addEventListener("focusin", handleFocus);
    if (sheet.contains(active)) entry.lastFocused = active;
    else {
      const focusable = Array.from(sheet.querySelectorAll(FOCUSABLE)).filter(
        (el) => !el.disabled && el.offsetParent !== null,
      );
      (focusable[0] || sheet).focus();
    }

    const handleKeyDown = (e) => {
      if (openStack[openStack.length - 1]?.id !== id) return;
      if (e.key === "Escape") {
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab") return;
      const nodes = Array.from(sheet.querySelectorAll(FOCUSABLE)).filter(
        (el) => !el.disabled && el.offsetParent !== null && el.closest('[role="dialog"]') === sheet,
      );
      if (!nodes.length) {
        e.preventDefault();
        sheet.focus();
        return;
      }
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      openStack = openStack.filter((entry) => entry.id !== id);
      document.removeEventListener("focusin", handleFocus);
      document.removeEventListener("keydown", handleKeyDown);
      if (!openStack.length) document.body.style.overflow = previousBodyOverflow;
      if (previouslyFocused?.isConnected && previouslyFocused?.focus) previouslyFocused.focus();
    };
  }, []);

  const dialog = (
    <div className="backdrop" onClick={requestClose} ref={backdropRef}>
      <div
        className={`sheet ${className || ""}`}
        onClick={(e) => e.stopPropagation()}
        onClickCapture={event => {
          if (protectDraft && event.target.closest('fieldset button:not([disabled])')) dirty.current = true;
        }}
        onChangeCapture={event => {
          if (protectDraft && !event.target.closest('.entry-navigation')) dirty.current = true;
        }}
        onSubmitCapture={event => {
          if (navigator.onLine === false) {
            event.preventDefault(); event.stopPropagation(); setOfflineError(true);
          } else setOfflineError(false);
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        ref={sheetRef}
      >
        <div className="sheet-handle" />
        <div className="sheet-hd">
          <h2 id={titleId}>{title}</h2>
          <button className="close-btn" onClick={requestClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        {offlineError && <p className="money-error" role="alert">Offline. Reconnect to save; your draft is still on this screen.</p>}
        {children}
      </div>
    </div>
  );
  // Escape animated/transformed views and their stacking contexts. This
  // keeps every sheet above the mobile nav and fixed to the actual screen.
  return portal ? createPortal(dialog, document.body) : dialog;
}
