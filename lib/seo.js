/**
 * Reusable SEO utilities for 9jaVibeMall
 * Handles canonical URLs, metadata generation, Schema.org JSON-LD, and HTML escaping.
 */

const CANONICAL_HOST = "https://www.9javibemall.com.ng";
const DEFAULT_IMAGE = `${CANONICAL_HOST}/assets/logo.png`;

function escapeHtml(str) {
  if (!str && str !== 0) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function truncate(str, maxLen = 155) {
  if (!str) return "";
  // Strip any HTML tags
  const clean = String(str).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  if (clean.length <= maxLen) return clean;
  return clean.slice(0, maxLen - 1).trim() + "…";
}

function formatNaira(amount) {
  const num = typeof amount === "number" ? amount : parseFloat(amount) || 0;
  return "₦" + num.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function buildCanonicalUrl(path = "/") {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${CANONICAL_HOST}${cleanPath}`;
}

function toW3CDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}

/**
 * Generate Product SEO metadata
 */
function generateProductMetadata(product) {
  const name = product.name || "Product";
  const slug = product.slug || product.id || "";
  const canonical = buildCanonicalUrl(`/product/${slug}`);

  const basePrice = parseFloat(product.price) || 0;
  const discount = parseFloat(product.discount) || 0;
  const finalPrice = discount > 0 ? basePrice - (basePrice * discount) / 100 : basePrice;

  const vendorName = product.business?.name ? ` by ${product.business.name}` : "";
  const categoryName = Array.isArray(product.categories) && product.categories[0]?.name
    ? ` in ${product.categories[0].name}`
    : "";

  const rawDesc = product.description
    ? truncate(product.description, 110)
    : "Discover great products on 9jaVibeMall.";

  const description = `${truncate(name, 50)}${vendorName}${categoryName} for ${formatNaira(finalPrice)}. ${rawDesc}`;

  let image = DEFAULT_IMAGE;
  if (Array.isArray(product.images) && product.images.length > 0 && product.images[0]) {
    image = product.images[0].startsWith("http") ? product.images[0] : `${CANONICAL_HOST}${product.images[0]}`;
  }

  return {
    title: `${name} | 9jaVibeMall`,
    description: truncate(description, 155),
    canonical,
    image,
    price: finalPrice,
    basePrice,
    discount,
    stock: typeof product.stock === "number" ? product.stock : 10,
  };
}

/**
 * Generate Business SEO metadata
 */
function generateBusinessMetadata(business) {
  const name = business.name || "Business Store";
  const id = business.business_id || business.id || "";
  const canonical = buildCanonicalUrl(`/business/${id}`);

  const city = business.address?.city || "";
  const state = business.address?.state?.name || business.address?.state || "";
  const location = [city, state].filter(Boolean).join(", ");
  const locationText = location ? ` located in ${location}` : "";
  const categoryText = business.category ? ` specializing in ${business.category}` : "";

  const description = `Shop directly from ${name}${locationText}${categoryText}. Browse authentic products and verified deals on 9jaVibeMall.`;

  let image = DEFAULT_IMAGE;
  if (business.businessImage) {
    image = business.businessImage.startsWith("http") ? business.businessImage : `${CANONICAL_HOST}${business.businessImage}`;
  } else if (Array.isArray(business.bannerImages) && business.bannerImages[0]) {
    image = business.bannerImages[0].startsWith("http") ? business.bannerImages[0] : `${CANONICAL_HOST}${business.bannerImages[0]}`;
  }

  return {
    title: `${name} - Store | 9jaVibeMall`,
    description: truncate(description, 155),
    canonical,
    image,
  };
}

/**
 * Generate Schema.org Product JSON-LD
 */
function generateProductJsonLd(product) {
  const meta = generateProductMetadata(product);
  const images = Array.isArray(product.images) && product.images.length > 0
    ? product.images.map(img => img.startsWith("http") ? img : `${CANONICAL_HOST}${img}`)
    : [meta.image];

  const inStock = (typeof product.stock === "number" ? product.stock : 1) > 0;

  const jsonLd = {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: product.name,
    description: truncate(product.description || product.name, 300),
    image: images,
    url: meta.canonical,
    offers: {
      "@type": "Offer",
      url: meta.canonical,
      priceCurrency: "NGN",
      price: meta.price.toFixed(2),
      availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      itemCondition: "https://schema.org/NewCondition",
    },
  };

  if (product.id) jsonLd.sku = String(product.id);

  if (Array.isArray(product.categories) && product.categories[0]?.name) {
    jsonLd.category = product.categories[0].name;
  }

  if (product.business?.name) {
    jsonLd.offers.seller = {
      "@type": "LocalBusiness",
      name: product.business.name,
      url: buildCanonicalUrl(`/business/${product.business.business_id || product.business.id}`),
    };
  }

  return JSON.stringify(jsonLd);
}

/**
 * Generate Schema.org LocalBusiness / Store JSON-LD
 */
function generateBusinessJsonLd(business) {
  const meta = generateBusinessMetadata(business);

  const jsonLd = {
    "@context": "https://schema.org/",
    "@type": "Store",
    name: business.name,
    description: truncate(business.description || business.name, 300),
    image: meta.image,
    url: meta.canonical,
  };

  if (business.address) {
    jsonLd.address = {
      "@type": "PostalAddress",
      streetAddress: [business.address.houseNo, business.address.street].filter(Boolean).join(" ") || undefined,
      addressLocality: business.address.city || undefined,
      addressRegion: business.address.state?.name || business.address.state || undefined,
      addressCountry: "NG",
    };
  }

  return JSON.stringify(jsonLd);
}

/**
 * Generate Schema.org WebSite JSON-LD
 */
function generateWebsiteJsonLd() {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "9jaVibeMall",
    url: CANONICAL_HOST,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${CANONICAL_HOST}/?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  });
}

/**
 * Generate BreadcrumbList JSON-LD
 */
function generateBreadcrumbJsonLd(crumbs = []) {
  const itemListElement = crumbs.map((crumb, idx) => ({
    "@type": "ListItem",
    position: idx + 1,
    name: crumb.name,
    item: crumb.url.startsWith("http") ? crumb.url : buildCanonicalUrl(crumb.url),
  }));

  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement,
  });
}

/**
 * Branded HTTP 404 Not Found Page Generator
 */
function renderNotFoundPage({ title = "Page Not Found", message = "The requested resource could not be found or may have been removed." } = {}) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)} | 9jaVibeMall</title>
  <meta name="robots" content="noindex, follow" />
  <link rel="icon" type="image/png" href="/assets/logo.png" />
  <link rel="stylesheet" href="/assets/styles.css" />
</head>
<body>
  <header class="navbar">
    <div class="nav-container">
      <a href="/" class="brand-link">
        <img src="/assets/logo.png" alt="9jaVibeMall Logo" class="brand-logo" />
        <span class="brand-title">9ja<span>Vibe</span>Mall</span>
      </a>
      <a href="/" class="btn btn-outline" style="padding: 0.5rem 1rem; font-size: 0.875rem;">
        Browse Marketplace
      </a>
    </div>
  </header>

  <main class="main-content" style="max-width: 600px; text-align: center; padding-top: 3rem; padding-bottom: 4rem;">
    <article class="card" style="padding: 3rem 1.5rem;">
      <div style="font-size: 3.5rem; margin-bottom: 1rem;">🔍</div>
      <h1 class="content-title" style="font-size: 1.75rem; margin-bottom: 0.75rem;">
        ${escapeHtml(title)}
      </h1>
      <p style="color: var(--gray-600); margin-bottom: 2rem; line-height: 1.6;">
        ${escapeHtml(message)}
      </p>
      <div class="cta-cluster" style="justify-content: center;">
        <a href="/" class="btn btn-primary btn-lg">
          Back to Marketplace
        </a>
        <a href="naijavibemall://" class="btn btn-dark btn-lg">
          Open 9jaVibeMall App
        </a>
      </div>
    </article>
  </main>

  <footer class="footer">
    <p>&copy; 2026 9jaVibeMall. Nigeria's Premier Commerce Marketplace.</p>
    <p style="margin-top: 0.5rem;">
      <a href="/">Home</a> &bull; 
      <a href="/contact">Contact Support</a> &bull; 
      <a href="naijavibemall://">Open App</a>
    </p>
  </footer>
</body>
</html>`;
}

module.exports = {
  CANONICAL_HOST,
  DEFAULT_IMAGE,
  escapeHtml,
  truncate,
  formatNaira,
  buildCanonicalUrl,
  toW3CDate,
  generateProductMetadata,
  generateBusinessMetadata,
  generateProductJsonLd,
  generateBusinessJsonLd,
  generateWebsiteJsonLd,
  generateBreadcrumbJsonLd,
  renderNotFoundPage,
};
