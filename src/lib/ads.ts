/**
 * Google AdSense publisher ID.
 *
 * The loader script is injected once in `src/app/layout.tsx`; individual ad
 * units render through `src/components/ads/AdUnit.tsx`. This same ID also has to
 * appear in `/public/ads.txt` (`pub-…` form, without the `ca-` prefix).
 */
export const ADSENSE_CLIENT =
  process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? "ca-pub-2493825353262578";
