import React from "react";
import { Helmet } from "react-helmet-async";

const SEO = ({ title, description, keywords, url, type = "website", image }) => {
  const siteName = "Packaging Bazaar";
  const defaultTitle = "Packaging Bazaar - Premium Packaging Solutions";
  const defaultDescription =
    "Your one-stop destination for premium, wholesale, and custom packaging solutions. Find boxes, bags, tapes, and more for your business needs.";
  const defaultKeywords =
    "packaging, wholesale packaging, custom boxes, shipping supplies, packing materials, Packaging Bazaar";
  const defaultUrl = window.location.href;
  const defaultImage = `${window.location.origin}/logo.png`; // Fallback image

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{title ? `${title} | ${siteName}` : defaultTitle}</title>
      <meta name="title" content={title || defaultTitle} />
      <meta name="description" content={description || defaultDescription} />
      <meta name="keywords" content={keywords || defaultKeywords} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={url || defaultUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url || defaultUrl} />
      <meta property="og:title" content={title || defaultTitle} />
      <meta property="og:description" content={description || defaultDescription} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:image" content={image || defaultImage} />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url || defaultUrl} />
      <meta property="twitter:title" content={title || defaultTitle} />
      <meta property="twitter:description" content={description || defaultDescription} />
      <meta property="twitter:image" content={image || defaultImage} />
    </Helmet>
  );
};

export default SEO;
