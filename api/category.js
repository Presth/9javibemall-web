const { fetchProductsList } = require("../lib/api");
const {
  escapeHtml,
  formatNaira,
  buildCanonicalUrl,
  renderNotFoundPage,
  generateBreadcrumbJsonLd,
} = require("../lib/seo");

module.exports = async function handler(req, res) {
  let categorySlug = req.query.slug;
  if (!categorySlug && req.url) {
    const segments = req.url.split("?")[0].split("/").filter(Boolean);
    const idx = segments.indexOf("category");
    if (idx !== -1 && segments.length > idx + 1) {
      categorySlug = segments[idx + 1];
    }
  }

  if (!categorySlug) {
    res.status(404);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.send(
      renderNotFoundPage({
        title: "Category Not Found",
        message: "Please specify a category to browse products.",
      })
    );
  }

  try {
    const cleanCategory = decodeURIComponent(categorySlug).replace(/[-_]+/g, " ").trim();
    const formattedCategory = cleanCategory.charAt(0).toUpperCase() + cleanCategory.slice(1);

    const { items: products } = await fetchProductsList({
      category: cleanCategory,
      perPage: 24,
      status: true,
    });

    const canonical = buildCanonicalUrl(`/category/${encodeURIComponent(categorySlug)}`);
    const title = `${formattedCategory} Products | 9jaVibeMall`;
    const description = `Shop authentic ${formattedCategory} items from verified Nigerian merchants on 9jaVibeMall. Enjoy competitive prices and fast delivery.`;

    const breadcrumbs = [
      { name: "Home", url: "/" },
      { name: "Categories", url: "/#categories" },
      { name: formattedCategory, url: `/category/${categorySlug}` },
    ];
    const breadcrumbJsonLd = generateBreadcrumbJsonLd(breadcrumbs);

    const collectionJsonLd = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: title,
      description,
      url: canonical,
      mainEntity: {
        "@type": "ItemList",
        itemListElement: products.map((p, idx) => ({
          "@type": "ListItem",
          position: idx + 1,
          url: buildCanonicalUrl(`/product/${p.slug || p.id}`),
          name: p.name,
        })),
      },
    });

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  
  <meta name="description" content="${escapeHtml(description)}" />
  <link rel="canonical" href="${escapeHtml(canonical)}" />
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />

  <!-- Open Graph -->
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="9jaVibeMall" />
  <meta property="og:url" content="${escapeHtml(canonical)}" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:image" content="https://www.9javibemall.com.ng/assets/logo.png" />

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:url" content="${escapeHtml(canonical)}" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="https://www.9javibemall.com.ng/assets/logo.png" />

  <link rel="icon" type="image/png" href="/assets/logo.png" />
  <link rel="stylesheet" href="/assets/styles.css" />

  <script type="application/ld+json">
    ${collectionJsonLd}
  </script>
  <script type="application/ld+json">
    ${breadcrumbJsonLd}
  </script>

  <style>
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
      <a href="naijavibemall://" class="btn btn-outline" style="padding: 0.5rem 1rem; font-size: 0.875rem;">
        Open App
      </a>
    </div>
  </header>

  <!-- Main Content -->
  <main class="main-content">
    <nav style="font-size: 0.85rem; color: var(--gray-500); margin-bottom: 1rem;">
      <a href="/" style="color: var(--primary); text-decoration: none;">Home</a> &bull; 
      <span style="color: var(--gray-700);">${escapeHtml(formattedCategory)}</span>
    </nav>

    <section class="card" style="padding: 2rem 1.5rem; margin-bottom: 2rem; text-align: center;">
      <span class="badge" style="margin-bottom: 0.75rem;">Category Showcase</span>
      <h1 class="content-title" style="font-size: 2rem; margin-bottom: 0.5rem;">
        ${escapeHtml(formattedCategory)}
      </h1>
      <p style="color: var(--gray-600); max-width: 600px; margin: 0 auto;">
        ${escapeHtml(description)}
      </p>
    </section>

    <section class="card" style="padding: 1.5rem; margin-bottom: 2rem;">
      <h2 style="font-size: 1.25rem; font-weight: 700; margin: 0 0 1rem 0;">
        Available Items (${products.length})
      </h2>

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
              alt="${escapeHtml(p.name)}"
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
        <p>No products currently found in this category.</p>
        <a href="/" class="btn btn-primary" style="margin-top: 1rem; display: inline-block;">
          Back to Marketplace
        </a>
      </div>
      `}
    </section>
  </main>

  <footer class="footer">
    <p>&copy; 2026 9jaVibeMall by Stellaris Nova Tech. All rights reserved.</p>
    <p style="margin-top: 0.5rem;">
      <a href="/">Home</a> &bull; 
      <a href="/contact">Contact Support</a> &bull; 
      <a href="naijavibemall://">Open in Mobile App</a>
    </p>
  </footer>
</body>
</html>`;

    res.status(200);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=3600");
    return res.send(html);
  } catch (err) {
    console.error("[SSR] Category error:", err);
    res.status(500);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.send(
      renderNotFoundPage({
        title: "Server Error",
        message: "An error occurred while loading this category.",
      })
    );
  }
};
