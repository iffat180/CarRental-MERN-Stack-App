import React, { useEffect } from "react";
import { SITE_URL } from "../lib/seo";

const DEFAULT_TITLE = "Wayfarer: rent cars from people, not fleets";
const DEFAULT_DESCRIPTION =
  "Rent a car directly from its owner. Slide through the cars near you, pick your dates, or describe your trip and get matched with the right one.";
const DEFAULT_IMAGE = `${SITE_URL}/og-image.jpg`;

interface SeoProps {
  /** Page title; the site name is added. Leave out for the home page. */
  title?: string;
  description?: string;
  /** Path on this site, for the canonical link and the social card URL, for example "/cars". */
  path?: string;
  /** Absolute URL of the picture shown when the page is shared. */
  image?: string;
  /** Ask search engines not to list the page (account and booking pages). */
  noindex?: boolean;
  /** Structured data (schema.org) for search engines, as a plain object. */
  jsonLd?: Record<string, unknown>;
}

/**
 * Sets the page's title, description and social-card tags. React 19 moves <title>,
 * <meta> and <link> rendered anywhere in the tree into <head>, so no helper library is
 * needed. This runs in the browser, so crawlers that execute JavaScript (Google) see it;
 * link-preview bots that do not (Facebook, LinkedIn, Slack) only see the defaults in
 * index.html. Fixing that needs server-side rendering.
 */
const Seo = ({
  title,
  description = DEFAULT_DESCRIPTION,
  path = "/",
  image = DEFAULT_IMAGE,
  noindex = false,
  jsonLd,
}: SeoProps) => {
  // The defaults in index.html are for crawlers without JavaScript. Remove them once a page
  // renders its own tags, or the page would have two descriptions and two titles and
  // crawlers would read the first, the stale default.
  useEffect(() => {
    document.head.querySelectorAll("[data-seo-default]").forEach((el) => el.remove());
  }, []);

  const fullTitle = title ? `${title} | Wayfarer` : DEFAULT_TITLE;
  const url = `${SITE_URL}${path}`;

  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <link rel="canonical" href={url} />
      )}

      <meta property="og:site_name" content="Wayfarer" />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {jsonLd && <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>}
    </>
  );
};

export default Seo;
