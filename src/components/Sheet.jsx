import { useEffect, useRef, useId } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

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
export default function Sheet({ title, onClose, children, className, portal = true }) {
  const sheetRef = useRef(null);
  const backdropRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
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
    <div className="backdrop" onClick={onClose} ref={backdropRef}>
      <div
        className={`sheet ${className || ""}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        ref={sheetRef}
      >
        <div className="sheet-handle" />
        <div className="sheet-hd">
          <h2 id={titleId}>{title}</h2>
          <button className="close-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
  // Escape animated/transformed views and their stacking contexts. This
  // keeps every sheet above the mobile nav and fixed to the actual screen.
  return portal ? createPortal(dialog, document.body) : dialog;
}
