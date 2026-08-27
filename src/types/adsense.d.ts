export {};

declare global {
  interface Window {
    /** Queue consumed by the AdSense loader; `.push({})` fills the next `<ins>`. */
    adsbygoogle: Record<string, unknown>[];
  }
}
