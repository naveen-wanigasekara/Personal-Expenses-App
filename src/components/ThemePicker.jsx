import { useContext, useId } from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { ThemeCtx } from "../context.js";

const OPTIONS = [
  { value: "dark", label: "Dark", icon: Moon },
  { value: "light", label: "Light", icon: Sun },
  { value: "system", label: "System", icon: Monitor },
];

export default function ThemePicker() {
  const { preference, changeTheme } = useContext(ThemeCtx);
  const id = useId();
  return (
    <fieldset className="theme-picker" aria-describedby={`${id}-hint`}>
      <legend>Appearance</legend>
      <p id={`${id}-hint`}>Choose a theme for this device.</p>
      <div className="theme-options">
        {OPTIONS.map(({ value, label, icon: Icon }) => (
          <label className="theme-option" key={value}>
            <input type="radio" name={`${id}-theme`} value={value}
              checked={preference === value} onChange={() => changeTheme(value)} />
            <Icon size={17} aria-hidden="true" />
            <span>{label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
