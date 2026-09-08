/**
 * Google AdSense publisher ID.
 *
 * The loader script is injected once in `src/app/layout.tsx`. This same ID also
 * has to appear in `/public/ads.txt` (`pub-…` form, without the `ca-` prefix).
 * No ad units are placed in the app yet — that waits until the site is approved.
 */
export const ADSENSE_CLIENT =
  process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? "ca-pub-2493825353262578";
