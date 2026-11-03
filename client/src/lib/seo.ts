/** The public address of the site, used for absolute URLs in social cards and the canonical link. */
export const SITE_URL = (
  import.meta.env.VITE_SITE_URL || "https://car-rental-nu-rouge.vercel.app"
).replace(/\/$/, "");

/** Trims text to a search-result-sized snippet without cutting a word in half. */
export const snippet = (text: string, max = 155): string => {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return clean.slice(0, max).replace(/\s+\S*$/, "") + "…";
};
