import { useEffect, useRef, useId } from "react";
import { X } from "lucide-react";

const FOCUSABLE =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

// Some modals (e.g. CategoriesModal) render another Sheet nested inside
// themselves for add/edit forms. This stack ensures Escape only closes the
// topmost one — without it, every mounted Sheet's own document-level
// keydown listener would fire and close all of them at once.
let openStack = [];

// Shared chrome for all modals: a bottom sheet on mobile/tablet that becomes
// a centered dialog at desktop widths (see app.css RESPONSIVE section).
// Owns body-scroll-lock, Escape-to-close, and a basic focus trap so each
// modal doesn't have to reimplement them.
export default function Sheet({ title, onClose, children, className }) {
  const sheetRef = useRef(null);
  const idRef = useRef(null);
  if (idRef.current === null) idRef.current = Symbol("sheet");
  const titleId = useId();

  useEffect(() => {
    const sheet = sheetRef.current;
    const id = idRef.current;
    openStack.push(id);
    const previouslyFocused = document.activeElement;
    const focusable = sheet.querySelectorAll(FOCUSABLE);
    (focusable[0] || sheet).focus();

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (openStack[openStack.length - 1] === id) onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const nodes = Array.from(sheet.querySelectorAll(FOCUSABLE)).filter(
        (el) => !el.disabled && el.offsetParent !== null,
      );
      if (!nodes.length) return;
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
      openStack = openStack.filter((sid) => sid !== id);
      document.removeEventListener("keydown", handleKeyDown);
      if (!openStack.length) document.body.style.overflow = "";
      if (previouslyFocused?.focus) previouslyFocused.focus();
    };
  }, [onClose]);

  return (
    <div className="backdrop" onClick={onClose}>
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
}
