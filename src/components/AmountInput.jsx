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
        onChange(!isNaN(n) && n !== 0 ? String(n) : "");
      }}
    />
  );
}
