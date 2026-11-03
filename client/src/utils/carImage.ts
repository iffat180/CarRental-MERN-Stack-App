/**
 * Lighter versions of the seeded car photos.
 *
 * The 18 seeded cars point at full-size originals on CloudFront (up to 1.6 MB
 * each, 11 MB in total). We keep resized WebP copies in /public/cars:
 *   carN-640.webp   (cards and thumbnails, ~25-50 KB)
 *   carN-1200.webp  (the big photo on a car's page, ~60-130 KB)
 * Any other URL (for example a photo an owner uploaded) is returned unchanged.
 */
const SEEDED = /^https:\/\/d3c38yoff69w1u\.cloudfront\.net\/cars\/car(\d+)\.(?:jpg|png)$/;

export const carImage = (url: string | undefined | null, size: "card" | "large" = "card"): string => {
  if (!url) return "";
  const match = SEEDED.exec(url);
  if (!match) return url;
  return `/cars/car${match[1]}-${size === "large" ? 1200 : 640}.webp`;
};
