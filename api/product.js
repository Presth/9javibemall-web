const { fetchProduct } = require("../lib/api");
const {
  escapeHtml,
  formatNaira,
  buildCanonicalUrl,
  generateProductMetadata,
  generateProductJsonLd,
  generateBreadcrumbJsonLd,
  renderNotFoundPage,
} = require("../lib/seo");

const fs = require("fs");
const path = require("path");

function isBot(req) {
  const ua = (req.headers && (req.headers["user-agent"] || req.headers["User-Agent"])) || "";
  return /googlebot|bingbot|yandex|baiduspider|facebookexternalhit|twitterbot|rogerbot|linkedinbot|embedly|quora link preview|showyoubot|outbrain|pinterest|slackbot|vkShare|W3C_Validator|curl|Wget/i.test(ua);
}

module.exports = async function handler(req, res) {
  // Extract product identifier from query or URL
  let identifier = req.query.id || req.query.slug;
  if (!identifier && req.url) {
    const segments = req.url.split("?")[0].split("/").filter(Boolean);
    const idx = segments.indexOf("product");
    if (idx !== -1 && segments.length > idx + 1) {
      identifier = segments[idx + 1];
    }
  }

  if (!identifier) {
    if (!isBot(req)) {
      const templatePath = path.join(__dirname, "..", "product", "index.html");
      if (fs.existsSync(templatePath)) {
        res.status(200);
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        return res.send(fs.readFileSync(templatePath, "utf8"));
      }
    }
    res.status(404);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.send(
      renderNotFoundPage({
        title: "No Product Specified",
        message: "Please specify a product slug or ID to view details.",
      })
    );
  }

  try {
    const product = await fetchProduct(identifier);

    if (!product) {
      res.status(404);
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.send(
        renderNotFoundPage({
          title: "Product Not Found",
          message: "We couldn't locate this product. It may have been removed or the link is incorrect.",
        })
      );
    }

    const meta = generateProductMetadata(product);
    const jsonLd = generateProductJsonLd(product);

    const breadcrumbs = [
      { name: "Home", url: "/" },
      ...(Array.isArray(product.categories) && product.categories[0]?.name
        ? [{ name: product.categories[0].name, url: `/category/${product.categories[0].name.toLowerCase()}` }]
        : []),
      { name: product.name, url: `/product/${product.slug || product.id}` },
    ];
    const breadcrumbJsonLd = generateBreadcrumbJsonLd(breadcrumbs);

    const customSchemeUrl = `naijavibemall://product/${product.id || identifier}`;

    const images = Array.isArray(product.images) && product.images.length > 0
      ? product.images
      : ["/assets/logo.png"];

    const business = product.business || null;
    const businessUrl = business
      ? `/business/${encodeURIComponent(business.business_id || business.id)}`
      : null;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(meta.title)}</title>
  
  <meta name="description" content="${escapeHtml(meta.description)}" />
  <link rel="canonical" href="${escapeHtml(meta.canonical)}" />
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="product" />
  <meta property="og:site_name" content="9jaVibeMall" />
  <meta property="og:url" content="${escapeHtml(meta.canonical)}" />
  <meta property="og:title" content="${escapeHtml(meta.title)}" />
  <meta property="og:description" content="${escapeHtml(meta.description)}" />
  <meta property="og:image" content="${escapeHtml(meta.image)}" />
  <meta property="product:price:amount" content="${meta.price.toFixed(2)}" />
  <meta property="product:price:currency" content="NGN" />

  <!-- Twitter / X -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:url" content="${escapeHtml(meta.canonical)}" />
  <meta name="twitter:title" content="${escapeHtml(meta.title)}" />
  <meta name="twitter:description" content="${escapeHtml(meta.description)}" />
  <meta name="twitter:image" content="${escapeHtml(meta.image)}" />

  <link rel="icon" type="image/png" href="/assets/logo.png" />
  <link rel="stylesheet" href="/assets/styles.css" />
  <script src="/api/config.js"></script>

  <!-- Schema.org Structured Data -->
  <script type="application/ld+json">
    ${jsonLd}
  </script>
  <script type="application/ld+json">
    ${breadcrumbJsonLd}
  </script>
</head>
<body>

  <!-- Navigation -->
  <header class="navbar">
    <div class="nav-container">
      <a href="/" class="brand-link" title="9jaVibeMall Marketplace Home">
        <img src="/assets/logo.png" alt="9jaVibeMall Official Logo" class="brand-logo" width="36" height="36" />
        <span class="brand-title">9ja<span>Vibe</span>Mall</span>
      </a>
      <button id="nav-open-app-btn" class="btn btn-outline" style="padding: 0.5rem 1rem; font-size: 0.875rem;">
        Open App
      </button>
    </div>
  </header>

  <!-- Main Content -->
  <main class="main-content">

    <!-- Breadcrumb navigation for crawler context -->
    <nav style="font-size: 0.85rem; color: var(--gray-500); margin-bottom: 1rem;">
      <a href="/" style="color: var(--primary); text-decoration: none;">Home</a> &bull; 
      ${Array.isArray(product.categories) && product.categories[0]?.name ? `
        <a href="/category/${encodeURIComponent(product.categories[0].name.toLowerCase())}" style="color: var(--primary); text-decoration: none;">
          ${escapeHtml(product.categories[0].name)}
        </a> &bull; ` : ""
      }
      <span style="color: var(--gray-700);">${escapeHtml(product.name)}</span>
    </nav>

    <!-- Smart App Banner -->
    <div class="smart-app-banner">
      <div class="smart-banner-info">
        <img src="/assets/logo.png" alt="9jaVibeMall App Icon" class="smart-banner-icon" width="40" height="40" />
        <div class="smart-banner-text">
          <h3>Open in 9jaVibeMall App</h3>
          <p id="platform-notice">Smooth in-app checkout, chat with seller, and express delivery across Nigeria.</p>
        </div>
      </div>
      <button id="banner-open-btn" class="btn btn-primary">
        Open in App
      </button>
    </div>

    <!-- Product Card Container with Pre-rendered Semantic HTML -->
    <article id="product-container" class="card">
      <div id="loaded-content">
        <div class="media-gallery">
          <img
            id="product-main-img"
            src="${escapeHtml(images[0])}"
            alt="${escapeHtml(product.name)} - Authentic Nigerian Marketplace Product"
            class="main-image"
          />
        </div>

        ${images.length > 1 ? `
        <div id="thumbnails-container" class="thumbnails-row">
          ${images.map((img, idx) => `
            <img
              src="${escapeHtml(img)}"
              alt="${escapeHtml(product.name)} - image ${idx + 1}"
              class="thumb-item ${idx === 0 ? "active" : ""}"
              onclick="document.getElementById('product-main-img').src='${escapeHtml(img)}'; document.querySelectorAll('.thumb-item').forEach(el=>el.classList.remove('active')); this.classList.add('active');"
            />
          `).join("")}
        </div>
        ` : ""}

        <div class="content-body">
          ${Array.isArray(product.categories) && product.categories.length > 0 ? `
          <div id="categories-row" class="badge-row">
            ${product.categories.map(cat => `
              <span class="badge badge-gray">${escapeHtml(typeof cat === "string" ? cat : cat.name)}</span>
            `).join("")}
          </div>
          ` : ""}

          <h1 id="product-title" class="content-title">${escapeHtml(product.name)}</h1>

          <div class="price-row">
            <span id="product-price" class="price-current">${escapeHtml(formatNaira(meta.price))}</span>
            ${meta.discount > 0 ? `
              <span id="product-original-price" class="price-original">${escapeHtml(formatNaira(meta.basePrice))}</span>
              <span id="product-discount-badge" class="price-discount">-${meta.discount}% OFF</span>
            ` : ""}
          </div>

          <!-- Business / Seller Card with Real Crawlable Link -->
          ${business ? `
          <a id="business-link" href="${escapeHtml(businessUrl)}" class="vendor-card" style="display: flex;">
            <img
              id="business-avatar"
              src="${escapeHtml(business.businessImage || '/assets/logo.png')}"
              alt="${escapeHtml(business.name || 'Verified Vendor')} Store Logo"
              class="vendor-avatar"
              width="48"
              height="48"
            />
            <div class="vendor-info">
              <h4 id="business-name">${escapeHtml(business.name || "Verified Business")}</h4>
              <p>Verified Seller &bull; View store and all items &rarr;</p>
            </div>
          </a>
          ` : ""}

          <!-- Description Section with Rich Content -->
          <div class="description-section">
            <h3>Product Description</h3>
            <p id="product-desc" class="description-text" style="white-space: pre-line;">${escapeHtml(product.description || "No description provided.")}</p>
          </div>

          <!-- CTAs -->
          <div class="cta-cluster">
            <button id="btn-open-app-primary" class="btn btn-primary btn-lg" style="flex: 1;">
              ⚡ Open in 9jaVibeMall
            </button>
            <a id="btn-download-primary" href="https://play.google.com/store/apps/details?id=com.stellarisnovatech.naijavibemall" target="_blank" rel="noopener noreferrer" class="btn btn-dark btn-lg dynamic-download-btn" style="flex: 1;">
              Download Mobile App
            </a>
          </div>
        </div>
      </div>
    </article>

    <!-- Download Section -->
    <section class="download-card">
      <h3>Shop on the 9jaVibeMall Mobile App</h3>
      <p>Enjoy secure payments, direct messaging with verified Nigerian vendors, and instant order tracking.</p>
      <div class="store-buttons">
        <a href="https://play.google.com/store/apps/details?id=com.stellarisnovatech.naijavibemall" target="_blank" rel="noopener noreferrer" class="btn btn-dark">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M3.609 1.814L13.792 12 3.61 22.186a2.404 2.404 0 0 1-.61-.318 2.38 2.38 0 0 1-.999-1.928V4.06c0-.77.37-1.487.999-1.928.188-.13.397-.24.609-.318zm11.235 11.238l2.25 2.25-11.758 6.786 9.508-9.036zm0-2.104L5.336 1.912 17.094 8.7l-2.25 2.248zm1.096 1.052l3.414 1.968c1.334.77 1.334 2.03 0 2.8l-3.414 1.97-2.316-2.316 2.316-2.422z"/></svg>
          Google Play Store
        </a>
        <a href="https://apps.apple.com/app/9javibemall/idYOUR_APP_STORE_ID" target="_blank" rel="noopener noreferrer" class="btn btn-dark">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.61-.75 1.04-1.8 1.01-2.87-.96.04-2.13.65-2.8 1.43-.59.68-1.11 1.76-1.03 2.81 1.07.08 2.19-.57 2.82-1.37z"/></svg>
          Apple App Store
        </a>
      </div>
    </section>

  </main>

  <!-- Footer with Internal Crawlable Links -->
  <footer class="footer">
    <p>&copy; 2026 9jaVibeMall by Stellaris Nova Tech. All rights reserved.</p>
    <p style="margin-top: 0.5rem;">
      <a href="/">Marketplace Home</a> &bull; 
      ${businessUrl ? `<a href="${escapeHtml(businessUrl)}">Seller Store</a> &bull; ` : ""}
      <a href="/contact">Contact Support</a> &bull; 
      <a href="${escapeHtml(customSchemeUrl)}">Open in Mobile App</a>
    </p>
  </footer>

  <script src="/assets/app.js"></script>
  <script>
    (function() {
      var customSchemeUrl = ${JSON.stringify(customSchemeUrl)};
      ["nav-open-app-btn", "banner-open-btn", "btn-open-app-primary"].forEach(function(btnId) {
        var btn = document.getElementById(btnId);
        if (btn) {
          btn.onclick = function() { triggerAppOpen(customSchemeUrl, true); };
        }
      });
    })();
  </script>
</body>
</html>`;

    res.status(200);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=3600");
    return res.send(html);
  } catch (err) {
    console.error("[SSR] Product error:", err);
    if (!isBot(req)) {
      const templatePath = path.join(__dirname, "..", "product", "index.html");
      if (fs.existsSync(templatePath)) {
        res.status(200);
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        return res.send(fs.readFileSync(templatePath, "utf8"));
      }
    }
    res.status(500);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.send(
      renderNotFoundPage({
        title: "Server Error",
        message: "An error occurred while loading this product. Please try again shortly.",
      })
    );
  }
};
