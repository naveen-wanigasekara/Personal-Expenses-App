import { useState, useEffect } from "react";
import { X, ChevronDown } from "lucide-react";
import { HELP_SECTIONS } from "../constants/helpContent.js";

export default function HelpModal({ onClose }) {
  const [openSection, setOpenSection] = useState(null);
  const [openItem, setOpenItem] = useState(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const toggleSection = (id) => {
    setOpenSection((prev) => (prev === id ? null : id));
    setOpenItem(null);
  };

  const toggleItem = (key) => setOpenItem((prev) => (prev === key ? null : key));

  return (
    <div className="backdrop" onClick={onClose}>
      <div className="sheet help-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-hd">
          <h2>Help &amp; Guide</h2>
          <button className="close-btn" onClick={onClose}><X size={18} /></button>
        </div>

        <p className="help-intro">Tap a section to explore, then tap a question for the answer.</p>

        <div className="help-sections">
          {HELP_SECTIONS.map((section) => {
            const isOpen = openSection === section.id;
            return (
              <div key={section.id} className={`help-section ${isOpen ? "open" : ""}`}>
                <button className="help-section-hd" onClick={() => toggleSection(section.id)}>
                  <span className="help-section-icon">{section.icon}</span>
                  <span className="help-section-title">{section.title}</span>
                  <ChevronDown size={15} className={`help-chevron ${isOpen ? "rotated" : ""}`} />
                </button>
                {isOpen && (
                  <div className="help-items">
                    {section.items.map((item, i) => {
                      const key = `${section.id}-${i}`;
                      const isItemOpen = openItem === key;
                      return (
                        <div key={key} className={`help-item ${isItemOpen ? "open" : ""}`}>
                          <button className="help-item-q" onClick={() => toggleItem(key)}>
                            <span>{item.q}</span>
                            <ChevronDown size={13} className={`help-chevron ${isItemOpen ? "rotated" : ""}`} />
                          </button>
                          {isItemOpen && (
                            <div className="help-item-a">
                              {item.a.split("\n").map((line, li) => <p key={li}>{line}</p>)}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ height: 20 }} />
      </div>
    </div>
  );
}
