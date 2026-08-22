const UTM_STORAGE_KEY = "impostor-utm";
const UTM_PARAMS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"] as const;

export type UtmParams = Partial<Record<(typeof UTM_PARAMS)[number], string>>;

/**
 * First-touch UTM attribution: capture campaign params from the landing URL
 * once, keep them in localStorage, and never overwrite them on later visits
 * (so a later organic visit doesn't clobber the campaign that actually
 * brought the player in). No third-party analytics involved.
 */
export function captureUtmParams(): void {
  if (typeof window === "undefined") return;
  try {
    if (window.localStorage.getItem(UTM_STORAGE_KEY)) return;
    const search = new URLSearchParams(window.location.search);
    const found: UtmParams = {};
    for (const key of UTM_PARAMS) {
      const value = search.get(key);
      if (value) found[key] = value.slice(0, 120);
    }
    if (Object.keys(found).length > 0) {
      window.localStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(found));
    }
  } catch {
    // localStorage unavailable — attribution is best-effort only.
  }
}

export function getStoredUtmParams(): UtmParams | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(UTM_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as UtmParams) : null;
  } catch {
    return null;
  }
}
