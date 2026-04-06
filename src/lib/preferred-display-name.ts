const STORAGE_KEY = "impostor_preferred_display_name";

export function getPreferredDisplayName(): string {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem(STORAGE_KEY)?.trim() ?? "";
  } catch {
    return "";
  }
}

export function setPreferredDisplayName(name: string): void {
  if (typeof window === "undefined") return;
  try {
    const t = name.trim();
    if (t) localStorage.setItem(STORAGE_KEY, t);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore quota / private mode */
  }
}
