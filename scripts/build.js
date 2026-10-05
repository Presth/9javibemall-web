/**
 * Build and validation script for 9jaVibeMall Web
 * Validates files, generates static fallback robots.txt and sitemap.xml
 */

const fs = require("fs");
const path = require("path");
const { CANONICAL_HOST } = require("../lib/seo");

console.log("========================================");
console.log("9jaVibeMall Web - Production SEO Build");
console.log("========================================");

const rootDir = path.resolve(__dirname, "..");

// 1. Verify .well-known files
console.log("\n[1/4] Verifying .well-known deep link associations...");
const assetLinksPath = path.join(rootDir, ".well-known", "assetlinks.json");
const appleAssocPath = path.join(rootDir, ".well-known", "apple-app-site-association");

if (!fs.existsSync(assetLinksPath)) {
  console.error("❌ Missing .well-known/assetlinks.json");
  process.exit(1);
}
if (!fs.existsSync(appleAssocPath)) {
  console.error("❌ Missing .well-known/apple-app-site-association");
  process.exit(1);
}

try {
  JSON.parse(fs.readFileSync(assetLinksPath, "utf-8"));
  JSON.parse(fs.readFileSync(appleAssocPath, "utf-8"));
  console.log("✓ Deep link association files are valid JSON.");
} catch (e) {
  console.error("❌ Invalid JSON in .well-known association files:", e.message);
  process.exit(1);
}

// 2. Generate static fallback robots.txt
console.log("\n[2/4] Generating static fallback robots.txt...");
const robotsContent = `# 9jaVibeMall Robots.txt
# Public marketplace content is crawlable. Private & internal paths are protected.

User-agent: *
Allow: /
Allow: /product/
Allow: /business/
Allow: /category/
Allow: /contact
Allow: /assets/
Allow: /.well-known/

# Disallow private, administrative, account, and transactional paths
Disallow: /api/
Disallow: /admin/
Disallow: /seller/
Disallow: /checkout/
Disallow: /cart/
Disallow: /delete-account/
Disallow: /order/
Disallow: /payment/
Disallow: /auth/
Disallow: /login/
Disallow: /register/

# Prevent crawl-budget waste on arbitrary search query strings
Disallow: /*?*

# Allow query params for specific essential pages if needed
Allow: /product/*
Allow: /business/*

# Sitemap Index Declaration
Sitemap: ${CANONICAL_HOST}/sitemap.xml
`;

fs.writeFileSync(path.join(rootDir, "robots.txt"), robotsContent, "utf-8");
console.log("✓ Generated robots.txt");

// 3. Generate static fallback sitemap.xml
console.log("\n[3/4] Generating static fallback sitemap.xml...");
const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${CANONICAL_HOST}/sitemaps/pages.xml</loc>
  </sitemap>
  <sitemap>
    <loc>${CANONICAL_HOST}/sitemaps/categories.xml</loc>
  </sitemap>
  <sitemap>
    <loc>${CANONICAL_HOST}/sitemaps/businesses-1.xml</loc>
  </sitemap>
  <sitemap>
    <loc>${CANONICAL_HOST}/sitemaps/products-1.xml</loc>
  </sitemap>
</sitemapindex>
`;

fs.writeFileSync(path.join(rootDir, "sitemap.xml"), sitemapContent, "utf-8");
console.log("✓ Generated sitemap.xml");

// 4. Mirror assets and public static files for hosts that default to public/
console.log("\n[4/5] Preparing public/ static distribution folder...");
const publicDir = path.join(rootDir, "public");
const publicAssetsDir = path.join(publicDir, "assets");
const rootAssetsDir = path.join(rootDir, "assets");

if (!fs.existsSync(publicAssetsDir)) {
  fs.mkdirSync(publicAssetsDir, { recursive: true });
}

// Copy all assets
if (fs.existsSync(rootAssetsDir)) {
  const assetFiles = fs.readdirSync(rootAssetsDir);
  for (const file of assetFiles) {
    fs.copyFileSync(
      path.join(rootAssetsDir, file),
      path.join(publicAssetsDir, file)
    );
  }
  console.log(`✓ Synchronized ${assetFiles.length} assets to public/assets/`);
}

// Copy robots.txt, sitemap.xml, and .well-known to public/
fs.copyFileSync(path.join(rootDir, "robots.txt"), path.join(publicDir, "robots.txt"));
fs.copyFileSync(path.join(rootDir, "sitemap.xml"), path.join(publicDir, "sitemap.xml"));

const publicWellKnown = path.join(publicDir, ".well-known");
if (!fs.existsSync(publicWellKnown)) fs.mkdirSync(publicWellKnown, { recursive: true });
if (fs.existsSync(assetLinksPath)) fs.copyFileSync(assetLinksPath, path.join(publicWellKnown, "assetlinks.json"));
if (fs.existsSync(appleAssocPath)) fs.copyFileSync(appleAssocPath, path.join(publicWellKnown, "apple-app-site-association"));
console.log("✓ Synchronized robots, sitemaps, and .well-known to public/");

// 5. Verify Serverless Handlers
console.log("\n[5/5] Verifying serverless and SEO modules...");
const modulesToVerify = [
  "../lib/api.js",
  "../lib/seo.js",
  "../api/product.js",
  "../api/business.js",
  "../api/category.js",
  "../api/sitemap.js",
  "../api/sitemaps.js",
  "../api/robots.js",
  "../api/assets.js",
  "../api/config.js",
];

for (const mod of modulesToVerify) {
  try {
    require(mod);
    console.log(`✓ Module verified: ${mod}`);
  } catch (err) {
    console.error(`❌ Module failed verification: ${mod}`, err);
    process.exit(1);
  }
}

console.log("\n========================================");
console.log("✅ Build and validation completed successfully!");
console.log("========================================");

