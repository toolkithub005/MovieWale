import { useEffect } from "react";
import { SITE_NAME, SITE_DESCRIPTION, SITE_URL } from "@/lib/constants";

function getMetaElement(name, property = false) {
  const selector = property
    ? `meta[property="${name}"]`
    : `meta[name="${name}"]`;

  return document.head.querySelector(selector);
}

function updateMetaTag(name, content, property = false) {
  const existing = getMetaElement(name, property);

  if (!content) {
    if (existing) {
      existing.remove();
    }
    return;
  }

  if (existing) {
    existing.setAttribute("content", content);
    return;
  }

  const tag = document.createElement("meta");

  if (property) {
    tag.setAttribute("property", name);
  } else {
    tag.setAttribute("name", name);
  }

  tag.setAttribute("content", content);
  document.head.appendChild(tag);
}

function updateLinkTag(rel, href) {
  if (!href) {
    return;
  }

  let link = document.head.querySelector(`link[rel="${rel}"]`);

  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", rel);
    document.head.appendChild(link);
  }

  link.setAttribute("href", href);
}

function updateStructuredData(schema) {
  const existing = document.getElementById("seo-schema-jsonld");

  if (existing) {
    existing.remove();
  }

  if (!schema) {
    return;
  }

  const script = document.createElement("script");
  script.id = "seo-schema-jsonld";
  script.type = "application/ld+json";
  script.text = JSON.stringify(schema, null, 2);
  document.head.appendChild(script);
}

function getPageUrl(url) {
  if (url) {
    return url;
  }

  if (typeof window === "undefined") {
    return SITE_URL;
  }

  return window.location.href;
}

export default function Seo({
  title,
  description,
  url,
  image,
  type = "website",
  noindex = false,
  schema,
}) {
  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const pageTitle =
      title || `${SITE_NAME} — Discover Movies, Trailers, Reviews & Entertainment`;
    document.title = pageTitle;

    updateMetaTag("description", description || SITE_DESCRIPTION);
    updateMetaTag("robots", noindex ? "noindex, nofollow" : "index, follow");

    updateMetaTag("og:title", pageTitle, true);
    updateMetaTag("og:description", description || SITE_DESCRIPTION, true);
    updateMetaTag("og:type", type, true);
    updateMetaTag("og:site_name", SITE_NAME, true);
    updateMetaTag("og:url", getPageUrl(url), true);

    updateMetaTag("twitter:card", "summary_large_image");
    updateMetaTag("twitter:title", pageTitle);
    updateMetaTag("twitter:description", description || SITE_DESCRIPTION);
    updateMetaTag("twitter:url", getPageUrl(url));

    if (image) {
      updateMetaTag("og:image", image, true);
      updateMetaTag("twitter:image", image);
    }

    updateLinkTag("canonical", getPageUrl(url));
    updateStructuredData(schema);
  }, [title, description, url, image, type, noindex, schema]);

  return null;
}
