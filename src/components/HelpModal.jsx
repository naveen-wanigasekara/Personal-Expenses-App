import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { HELP_SECTIONS } from "../constants/helpContent.js";
import Sheet from "./Sheet.jsx";

export default function HelpModal({ onClose }) {
  const [openSection, setOpenSection] = useState(null);
  const [openItem, setOpenItem] = useState(null);

  const toggleSection = (id) => {
    setOpenSection((prev) => (prev === id ? null : id));
    setOpenItem(null);
  };

  const toggleItem = (key) =>
    setOpenItem((prev) => (prev === key ? null : key));

  return (
    <Sheet title="Help & Guide" onClose={onClose} className="help-sheet">
      <p className="help-intro">
        Tap a section to explore, then tap a question for the answer.
      </p>

      <div className="help-sections">
        {HELP_SECTIONS.map((section) => {
          const isOpen = openSection === section.id;
          return (
            <div
              key={section.id}
              className={`help-section ${isOpen ? "open" : ""}`}
            >
              <button
                className="help-section-hd"
                onClick={() => toggleSection(section.id)}
              >
                <span className="help-section-icon">{section.icon}</span>
                <span className="help-section-title">{section.title}</span>
                <ChevronDown
                  size={15}
                  className={`disclosure-chevron ${isOpen ? "open" : ""}`}
                />
              </button>
              {isOpen && (
                <div className="help-items">
                  {section.items.map((item, i) => {
                    const key = `${section.id}-${i}`;
                    const isItemOpen = openItem === key;
                    return (
                      <div
                        key={key}
                        className={`help-item ${isItemOpen ? "open" : ""}`}
                      >
                        <button
                          className="help-item-q"
                          onClick={() => toggleItem(key)}
                        >
                          <span>{item.q}</span>
                          <ChevronDown
                            size={13}
                            className={`disclosure-chevron ${isItemOpen ? "open" : ""}`}
                          />
                        </button>
                        {isItemOpen && (
                          <div className="help-item-a">
                            {item.a.split("\n").map((line, li) => (
                              <p key={li}>{line}</p>
                            ))}
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
    </Sheet>
  );
}
