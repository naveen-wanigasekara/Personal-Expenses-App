import { useState, useEffect } from "react";

export default function AmountInput({
  value,
  onChange,
  placeholder,
  className,
  autoFocus,
}) {
  const fmtFull = (v) => {
    const n = Number(v);
    if ((!v && v !== 0) || isNaN(n) || n === 0) return "";
    const [i, d] = n.toFixed(2).split(".");
    return parseInt(i, 10).toLocaleString("en-US") + "." + d;
  };
  const fmtLive = (raw) => {
    const parts = raw.split(".");
    const i = parts[0] ? parseInt(parts[0], 10).toLocaleString("en-US") : "";
    return raw.includes(".") ? i + "." + parts[1] : i;
  };

  const [display, setDisplay] = useState(() => fmtFull(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setDisplay(fmtFull(value));
  }, [value, focused]);

  return (
    <input
      type="text"
      inputMode="decimal"
      className={className}
      value={display}
      placeholder={placeholder}
      autoFocus={autoFocus}
      onChange={(e) => {
        const raw = e.target.value.replace(/,/g, "");
        if (!/^\d*\.?\d*$/.test(raw)) return;
        setDisplay(fmtLive(raw));
        onChange(raw);
      }}
      onFocus={(e) => {
        setFocused(true);
        e.target.select();
      }}
      onBlur={(e) => {
        setFocused(false);
        const n = parseFloat(e.target.value.replace(/,/g, ""));
        const formatted = !isNaN(n) && n !== 0 ? fmtFull(n) : "";
        setDisplay(formatted);
        const next = !isNaN(n) && n !== 0 ? String(n) : "";
        // Only propagate if the numeric value actually changed. This is
        // purely a reformat-on-blur (e.g. "500" -> "500.00") when nothing
        // was typed, but callers use onChange to detect genuine edits —
        // e.g. AddModal's card-payment amount auto-suggest treats any
        // onChange as "the user took over" and stops re-filling it when
        // the selected card changes. Firing onChange here unconditionally
        // made that trip on a plain blur (such as clicking a different
        // card in the picker) even though the user never edited anything.
        const prev = parseFloat(value);
        if ((isNaN(prev) ? 0 : prev) !== (isNaN(n) ? 0 : n)) {
          onChange(next);
        }
      }}
    />
  );
}
