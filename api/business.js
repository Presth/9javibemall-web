const { fetchBusiness, fetchBusinessProducts } = require("../lib/api");
const {
  escapeHtml,
  formatNaira,
  buildCanonicalUrl,
  generateBusinessMetadata,
  generateBusinessJsonLd,
  generateBreadcrumbJsonLd,
  renderNotFoundPage,
} = require("../lib/seo");

module.exports = async function handler(req, res) {
  let identifier = req.query.id;
  if (!identifier && req.url) {
    const segments = req.url.split("?")[0].split("/").filter(Boolean);
    const idx = segments.indexOf("business");
    if (idx !== -1 && segments.length > idx + 1) {
      identifier = segments[idx + 1];
    }
  }

  if (!identifier) {
    res.status(404);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.send(
      renderNotFoundPage({
        title: "No Store Specified",
        message: "Please specify a business ID to view store catalog.",
      })
    );
  }

  try {
    const business = await fetchBusiness(identifier);

    if (!business) {
      res.status(404);
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.send(
        renderNotFoundPage({
          title: "Business Not Found",
          message: "We couldn't locate this store. It may be unverified, inactive, or the link is incorrect.",
        })
      );
    }

    // Fetch store products to establish crawlable internal links
    const products = await fetchBusinessProducts(business.business_id || business.id, 24);

    const meta = generateBusinessMetadata(business);
    const jsonLd = generateBusinessJsonLd(business);

    const breadcrumbs = [
      { name: "Home", url: "/" },
      { name: "Stores", url: "/#stores" },
      { name: business.name, url: `/business/${business.business_id || business.id}` },
    ];
    const breadcrumbJsonLd = generateBreadcrumbJsonLd(breadcrumbs);

    const customSchemeUrl = `naijavibemall://business/${business.business_id || business.id}`;

    const city = business.address?.city || "";
    const state = business.address?.state?.name || business.address?.state || "";
    const location = [city, state].filter(Boolean).join(", ");

    const bannerImg = Array.isArray(business.bannerImages) && business.bannerImages[0]
      ? business.bannerImages[0]
      : "/assets/logo.png";
    const logoImg = business.businessImage || "/assets/logo.png";

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
  <meta property="og:type" content="profile" />
  <meta property="og:site_name" content="9jaVibeMall" />
  <meta property="og:url" content="${escapeHtml(meta.canonical)}" />
  <meta property="og:title" content="${escapeHtml(meta.title)}" />
  <meta property="og:description" content="${escapeHtml(meta.description)}" />
  <meta property="og:image" content="${escapeHtml(meta.image)}" />

  <!-- Twitter / X -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:url" content="${escapeHtml(meta.canonical)}" />
  <meta name="twitter:title" content="${escapeHtml(meta.title)}" />
  <meta name="twitter:description" content="${escapeHtml(meta.description)}" />
  <meta name="twitter:image" content="${escapeHtml(meta.image)}" />

  <link rel="icon" type="image/png" href="/assets/logo.png" />
  <link rel="stylesheet" href="/assets/styles.css" />

  <!-- Schema.org Structured Data -->
  <script type="application/ld+json">
    ${jsonLd}
  </script>
  <script type="application/ld+json">
    ${breadcrumbJsonLd}
  </script>

  <style>
    .business-header {
      position: relative;
      background: var(--gray-900);
      min-height: 180px;
      display: flex;
      align-items: flex-end;
      overflow: hidden;
      border-radius: var(--radius-lg) var(--radius-lg) 0 0;
    }
    .business-banner {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      opacity: 0.75;
    }
    .business-profile-row {
      position: relative;
      display: flex;
      align-items: flex-end;
      gap: 1.25rem;
      padding: 0 1.5rem;
      margin-top: -45px;
      z-index: 10;
    }
    .business-logo {
      width: 90px;
      height: 90px;
      border-radius: 18px;
      border: 4px solid var(--white);
      background: var(--white);
      object-fit: cover;
      box-shadow: var(--shadow-md);
    }
    .products-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
      gap: 1rem;
      margin-top: 1.25rem;
    }
    .product-mini-card {
      background: var(--white);
      border: 1px solid var(--gray-200);
      border-radius: var(--radius-md);
      overflow: hidden;
      text-decoration: none;
      color: inherit;
      transition: transform 0.15s ease, box-shadow 0.15s ease;
      display: flex;
      flex-direction: column;
    }
    .product-mini-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }
    .product-mini-img {
      width: 100%;
      height: 140px;
      object-fit: cover;
      background: var(--gray-100);
    }
    .product-mini-info {
      padding: 0.75rem;
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .product-mini-title {
      font-size: 0.875rem;
      font-weight: 600;
      line-height: 1.3;
      margin-bottom: 0.35rem;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .product-mini-price {
      font-size: 0.95rem;
      font-weight: 800;
      color: var(--primary);
    }
  </style>
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

    <!-- Breadcrumb navigation -->
    <nav style="font-size: 0.85rem; color: var(--gray-500); margin-bottom: 1rem;">
      <a href="/" style="color: var(--primary); text-decoration: none;">Home</a> &bull; 
      <span style="color: var(--gray-700);">${escapeHtml(business.name)}</span>
    </nav>

    <!-- Smart App Banner -->
    <div class="smart-app-banner">
      <div class="smart-banner-info">
        <img src="/assets/logo.png" alt="9jaVibeMall App Icon" class="smart-banner-icon" width="40" height="40" />
        <div class="smart-banner-text">
          <h3>Shop Directly from ${escapeHtml(business.name)}</h3>
          <p id="platform-notice">Browse full catalog, chat with vendor, and enjoy express delivery.</p>
        </div>
      </div>
      <button id="banner-open-btn" class="btn btn-primary">
        Open in App
      </button>
    </div>

    <!-- Pre-rendered Store Header and Info -->
    <article id="business-container" class="card" style="padding: 0; overflow: hidden; margin-bottom: 2rem;">
      <div class="business-header">
        <img
          src="${escapeHtml(bannerImg)}"
          alt="${escapeHtml(business.name)} Store Banner"
          class="business-banner"
        />
      </div>

      <div class="business-profile-row">
        <img
          src="${escapeHtml(logoImg)}"
          alt="${escapeHtml(business.name)} Store Logo"
          class="business-logo"
          width="90"
          height="90"
        />
        <div style="padding-bottom: 0.5rem; flex: 1;">
          <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
            <h1 class="content-title" style="font-size: 1.6rem; margin: 0;">
              ${escapeHtml(business.name)}
            </h1>
            <span class="badge" style="background: var(--success); color: white; font-size: 0.75rem;">
              ✓ Verified Store
            </span>
          </div>

          <div style="display: flex; gap: 0.75rem; margin-top: 0.35rem; font-size: 0.85rem; color: var(--gray-600); flex-wrap: wrap;">
            ${business.category ? `<span>🏷️ ${escapeHtml(business.category)}</span>` : ""}
            ${location ? `<span>📍 ${escapeHtml(location)}</span>` : ""}
            ${business.yearFounded ? `<span>📅 Est. ${escapeHtml(business.yearFounded)}</span>` : ""}
          </div>
        </div>
      </div>

      <div class="content-body" style="padding-top: 1.5rem;">
        <!-- Store Description -->
        <div class="description-section" style="margin-top: 0;">
          <h3>About ${escapeHtml(business.name)}</h3>
          <p class="description-text" style="white-space: pre-line;">
            ${escapeHtml(business.description || `${business.name} is a verified merchant on 9jaVibeMall offering quality products and prompt delivery across Nigeria.`)}
          </p>
        </div>

        <!-- Store CTAs -->
        <div class="cta-cluster">
          <button id="btn-open-app-primary" class="btn btn-primary btn-lg" style="flex: 1;">
            ⚡ Open Store in 9jaVibeMall
          </button>
          <a href="https://play.google.com/store/apps/details?id=com.stellarisnovatech.naijavibemall" target="_blank" rel="noopener noreferrer" class="btn btn-dark btn-lg dynamic-download-btn" style="flex: 1;">
            Download Mobile App
          </a>
        </div>
      </div>
    </article>

    <!-- Store Catalog with Real Crawlable HTML Links -->
    <section class="card" style="padding: 1.5rem; margin-bottom: 2rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--gray-200); padding-bottom: 0.75rem;">
        <h2 style="font-size: 1.25rem; font-weight: 700; margin: 0;">
          Store Products (${products.length})
        </h2>
        <span style="font-size: 0.85rem; color: var(--gray-500);">
          Available for Order
        </span>
      </div>

      ${products.length > 0 ? `
      <div class="products-grid">
        ${products.map(p => {
          const pImage = Array.isArray(p.images) && p.images[0] ? p.images[0] : "/assets/logo.png";
          const pPrice = parseFloat(p.price) || 0;
          const pDiscount = parseFloat(p.discount) || 0;
          const pFinalPrice = pDiscount > 0 ? pPrice - (pPrice * pDiscount) / 100 : pPrice;
          const pUrl = `/product/${encodeURIComponent(p.slug || p.id)}`;

          return `
          <a href="${escapeHtml(pUrl)}" class="product-mini-card" title="${escapeHtml(p.name)}">
            <img
              src="${escapeHtml(pImage)}"
              alt="${escapeHtml(p.name)} by ${escapeHtml(business.name)}"
              class="product-mini-img"
              loading="lazy"
              width="190"
              height="140"
            />
            <div class="product-mini-info">
              <h3 class="product-mini-title">${escapeHtml(p.name)}</h3>
              <div style="display: flex; align-items: baseline; gap: 0.35rem;">
                <span class="product-mini-price">${escapeHtml(formatNaira(pFinalPrice))}</span>
                ${pDiscount > 0 ? `
                  <span style="font-size: 0.75rem; text-decoration: line-through; color: var(--gray-500);">${escapeHtml(formatNaira(pPrice))}</span>
                ` : ""}
              </div>
            </div>
          </a>
          `;
        }).join("")}
      </div>
      ` : `
      <div style="text-align: center; padding: 2.5rem 1rem; color: var(--gray-500);">
        <p style="font-size: 2rem; margin-bottom: 0.5rem;">🛍️</p>
        <p>No active products currently cataloged for this store.</p>
        <a href="/" class="btn btn-primary" style="margin-top: 1rem; display: inline-block;">
          Browse All Marketplace Items
        </a>
      </div>
      `}
    </section>

    <!-- Download Section -->
    <section class="download-card">
      <h3>Shop on the 9jaVibeMall Mobile App</h3>
      <p>Connect directly with verified store owners, enjoy secure escrow payments, and track shipments in real time.</p>
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
    console.error("[SSR] Business error:", err);
    res.status(500);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.send(
      renderNotFoundPage({
        title: "Server Error",
        message: "An error occurred while loading this store. Please try again shortly.",
      })
    );
  }
};
