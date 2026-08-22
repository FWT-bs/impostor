export const THEME_STORAGE_KEY = "impostor-theme";

export type ThemeName = "tabletop-dark" | "tabletop";

export function getStoredTheme(): ThemeName {
  if (typeof window === "undefined") return "tabletop-dark";
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  return stored === "light" || stored === "tabletop" ? "tabletop" : "tabletop-dark";
}

export function applyTheme(theme: ThemeName) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = theme;
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme === "tabletop" ? "light" : "dark");
  } catch {
    // localStorage unavailable (private mode, etc.) — theme just won't persist.
  }
}
