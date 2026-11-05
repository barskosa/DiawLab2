import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Icon } from "./components.jsx";

const STORAGE_KEY = "rota.theme";
const ThemeContext = createContext(null);
const systemTheme = () =>
  window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
function savedTheme() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === "light" || saved === "dark" ? saved : null;
  } catch {
    return null;
  }
}

export function ThemeProvider({ children }) {
  const [theme, updateTheme] = useState(() => savedTheme() || systemTheme());
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta)
      meta.content = getComputedStyle(document.documentElement)
        .getPropertyValue("--color-bg")
        .trim();
  }, [theme]);
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const preferenceChanged = () => {
      if (!savedTheme()) updateTheme(systemTheme());
    };
    const storageChanged = (event) => {
      if (event.key === STORAGE_KEY || event.key === null)
        updateTheme(savedTheme() || systemTheme());
    };
    media.addEventListener("change", preferenceChanged);
    window.addEventListener("storage", storageChanged);
    return () => {
      media.removeEventListener("change", preferenceChanged);
      window.removeEventListener("storage", storageChanged);
    };
  }, []);
  const value = useMemo(() => {
    function setTheme(next) {
      if (next !== "light" && next !== "dark") return;
      updateTheme(next);
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        /* The current tab still changes when storage is unavailable. */
      }
    }
    return {
      theme,
      setTheme,
      toggleTheme: () => setTheme(theme === "dark" ? "light" : "dark"),
    };
  }, [theme]);
  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context)
    throw new Error("useTheme deve ser utilizado dentro de ThemeProvider.");
  return context;
}

export function ThemeToggle({ compact = false, className = "" }) {
  const { theme, toggleTheme } = useTheme();
  const label = `Ativar tema ${theme === "dark" ? "claro" : "escuro"}`;
  return (
    <button
      type="button"
      className={`theme-toggle ${compact ? "theme-toggle-compact" : ""} ${className}`}
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      aria-pressed={theme === "dark"}
    >
      <Icon name={theme === "dark" ? "sun" : "moon"} size={18} />
      {!compact && (
        <span>{theme === "dark" ? "Tema escuro" : "Tema claro"}</span>
      )}
    </button>
  );
}
