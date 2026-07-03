import { Target, LineChart, ChevronRight } from "lucide-react";
import Sheet from "./Sheet.jsx";

// Mobile/tablet-only full-height slide-in menu (desktop keeps Budget and
// Investments as standalone sidebar links, unaffected — see the CSS that
// hides .nav-drawer at >=1024px). Built on top of Sheet for its existing
// scroll-lock/Escape/focus-trap behavior, just reshaped via the
// .nav-drawer class into a left-anchored panel instead of a bottom sheet.
export default function NavDrawer({ onClose, onNavigate }) {
  return (
    <Sheet title="Menu" onClose={onClose} className="nav-drawer">
      <button
        className="settings-menu-row"
        onClick={() => onNavigate("budget")}
      >
        <Target size={16} />
        <span>Budget</span>
        <ChevronRight
          size={15}
          style={{ marginLeft: "auto", color: "var(--ink-faint)" }}
        />
      </button>
      <button
        className="settings-menu-row"
        onClick={() => onNavigate("investments")}
      >
        <LineChart size={16} />
        <span>Investments</span>
        <ChevronRight
          size={15}
          style={{ marginLeft: "auto", color: "var(--ink-faint)" }}
        />
      </button>
    </Sheet>
  );
}
