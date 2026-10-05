/**
 * Comprehensive SEO and Deep Linking Test Suite for 9jaVibeMall Web
 */

const http = require("http");
const server = require("../server");

const TEST_PORT = 4567;
const BASE = `http://localhost:${TEST_PORT}`;

let passedCount = 0;
let failedCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passedCount++;
  } else {
    console.error(`  ❌ FAILED: ${message}`);
    failedCount++;
  }
}

async function request(path) {
  return new Promise((resolve, reject) => {
    http.get(`${BASE}${path}`, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data,
        });
      });
    }).on("error", reject);
  });
}

async function runTests() {
  console.log("========================================");
  console.log("Running 9jaVibeMall SEO Verification Tests");
  console.log("========================================\n");

  await new Promise(resolve => server.listen(TEST_PORT, resolve));

  try {
    // TEST 1: Robots.txt
    console.log("[1] Testing /robots.txt...");
    const robots = await request("/robots.txt");
    assert(robots.status === 200, "robots.txt returns HTTP 200");
    assert(robots.headers["content-type"].includes("text/plain"), "robots.txt Content-Type is text/plain");
    assert(robots.body.includes("Sitemap: https://www.9javibemall.com.ng/sitemap.xml"), "robots.txt references canonical sitemap");
    assert(robots.body.includes("Allow: /product/"), "robots.txt allows /product/");
    assert(robots.body.includes("Allow: /business/"), "robots.txt allows /business/");
    assert(robots.body.includes("Disallow: /admin/"), "robots.txt protects /admin/");
    assert(!robots.body.includes("Disallow: /product/"), "robots.txt does not accidentally block /product/");

    // TEST 2: Sitemap Index
    console.log("\n[2] Testing /sitemap.xml (Sitemap Index)...");
    const sitemap = await request("/sitemap.xml");
    assert(sitemap.status === 200, "/sitemap.xml returns HTTP 200");
    assert(sitemap.headers["content-type"].includes("xml"), "/sitemap.xml Content-Type is XML");
    assert(sitemap.body.includes("<sitemapindex"), "/sitemap.xml is a valid sitemapindex");
    assert(sitemap.body.includes("/sitemaps/pages.xml"), "sitemap references pages.xml");
    assert(sitemap.body.includes("/sitemaps/businesses-1.xml"), "sitemap references businesses-1.xml");
    assert(sitemap.body.includes("/sitemaps/products-1.xml"), "sitemap references products-1.xml");
    assert(sitemap.body.includes("https://www.9javibemall.com.ng/"), "sitemap URLs use canonical domain");

    // TEST 3: Sub-sitemap pages.xml
    console.log("\n[3] Testing /sitemaps/pages.xml...");
    const pagesSitemap = await request("/sitemaps/pages.xml");
    assert(pagesSitemap.status === 200, "pages.xml returns HTTP 200");
    assert(pagesSitemap.body.includes("<urlset"), "pages.xml is a valid urlset");
    assert(pagesSitemap.body.includes("https://www.9javibemall.com.ng/</loc>"), "pages.xml includes homepage");
    assert(pagesSitemap.body.includes("https://www.9javibemall.com.ng/contact</loc>"), "pages.xml includes contact page");
    assert(!pagesSitemap.body.includes("/cart"), "pages.xml excludes private /cart");
    assert(!pagesSitemap.body.includes("/checkout"), "pages.xml excludes private /checkout");

    // TEST 4: Missing product returns HTTP 404 (Not soft-404)
    console.log("\n[4] Testing missing product HTTP 404 handling...");
    const missingProduct = await request("/product/non-existent-product-slug-xyz-9999");
    assert(missingProduct.status === 404, "Non-existent product returns real HTTP 404 (not soft 404)");
    assert(missingProduct.body.includes('content="noindex'), "404 page contains noindex meta robots");
    assert(missingProduct.body.includes("Product Not Found"), "404 page displays helpful message");
    assert(missingProduct.body.includes('href="/"'), "404 page contains crawlable link to marketplace home");

    // TEST 5: Missing business returns HTTP 404
    console.log("\n[5] Testing missing business HTTP 404 handling...");
    const missingBusiness = await request("/business/non-existent-business-xyz-9999");
    assert(missingBusiness.status === 404, "Non-existent business returns real HTTP 404");
    assert(missingBusiness.body.includes('content="noindex'), "404 page contains noindex meta robots");

    // TEST 6: Android App Links (.well-known/assetlinks.json)
    console.log("\n[6] Testing .well-known/assetlinks.json...");
    const assetlinks = await request("/.well-known/assetlinks.json");
    assert(assetlinks.status === 200, "assetlinks.json returns HTTP 200");
    assert(assetlinks.headers["content-type"].includes("json"), "assetlinks.json Content-Type is application/json");
    let assetlinksJson;
    try { assetlinksJson = JSON.parse(assetlinks.body); } catch(e){}
    assert(Array.isArray(assetlinksJson), "assetlinks.json is valid JSON array");
    assert(assetlinksJson?.[0]?.target?.package_name === "com.stellarisnovatech.naijavibemall", "assetlinks has correct package_name");

    // TEST 7: Apple Universal Links (.well-known/apple-app-site-association)
    console.log("\n[7] Testing .well-known/apple-app-site-association...");
    const appleAssoc = await request("/.well-known/apple-app-site-association");
    assert(appleAssoc.status === 200, "apple-app-site-association returns HTTP 200");
    assert(appleAssoc.headers["content-type"].includes("json"), "apple-app-site-association Content-Type is application/json");
    let appleAssocJson;
    try { appleAssocJson = JSON.parse(appleAssoc.body); } catch(e){}
    assert(typeof appleAssocJson === "object" && appleAssocJson !== null, "apple-app-site-association is valid JSON");
    assert(Boolean(appleAssocJson?.applinks?.details), "apple-app-site-association has applinks.details");

    // TEST 8: Homepage Canonical & Metadata
    console.log("\n[8] Testing / (Homepage)...");
    const home = await request("/");
    assert(home.status === 200, "Homepage returns HTTP 200");
    assert(home.body.includes('rel="canonical" href="https://www.9javibemall.com.ng/"'), "Homepage has canonical www.9javibemall.com.ng");

    // TEST 9: SSR Rendering & JSON-LD Unit Test with mock API data
    console.log("\n[9] Testing Product SEO and JSON-LD Generator...");
    const {
      generateProductMetadata,
      generateProductJsonLd,
      generateBusinessMetadata,
      generateBusinessJsonLd,
    } = require("../lib/seo");

    const sampleProduct = {
      id: "prod-123",
      slug: "nike-air-max-270",
      name: "Nike Air Max 270",
      description: "Men's athletic running sneaker in black and white.",
      price: "45000",
      discount: 10,
      images: ["https://cdn.9javibemall.com.ng/products/nike1.jpg"],
      stock: 5,
      categories: [{ name: "Footwear" }],
      business: {
        id: "biz-456",
        business_id: "BIZ456",
        name: "Lagos Sneaker Hub",
      },
    };

    const prodMeta = generateProductMetadata(sampleProduct);
    assert(prodMeta.title.includes("Nike Air Max 270 | 9jaVibeMall"), "Product title follows naming convention");
    assert(prodMeta.canonical === "https://www.9javibemall.com.ng/product/nike-air-max-270", "Product canonical is clean URL");
    assert(prodMeta.price === 40500, "Discount calculation is accurate");

    const prodJsonLdStr = generateProductJsonLd(sampleProduct);
    const prodJsonLd = JSON.parse(prodJsonLdStr);
    assert(prodJsonLd["@type"] === "Product", "Product JSON-LD @type is Product");
    assert(prodJsonLd.name === "Nike Air Max 270", "Product JSON-LD name is accurate");
    assert(prodJsonLd.offers?.priceCurrency === "NGN", "Offers currency is NGN");
    assert(prodJsonLd.offers?.price === "40500.00", "Offers price is formatted in NGN");
    assert(prodJsonLd.offers?.availability.includes("InStock"), "Offers availability is InStock");
    assert(prodJsonLd.offers?.seller?.name === "Lagos Sneaker Hub", "Seller information is linked in JSON-LD");

    // TEST 10: Business SEO and JSON-LD Generator
    console.log("\n[10] Testing Business SEO and JSON-LD Generator...");
    const sampleBusiness = {
      id: "biz-789",
      business_id: "BIZ789",
      name: "Abuja Tech Store",
      description: "Official retailer of electronics and accessories.",
      category: "Electronics",
      businessImage: "https://cdn.9javibemall.com.ng/stores/logo.jpg",
      address: {
        houseNo: "12",
        street: "Adetokunbo Ademola Crescent",
        city: "Wuse 2",
        state: { name: "Abuja" },
      },
    };

    const bizMeta = generateBusinessMetadata(sampleBusiness);
    assert(bizMeta.title.includes("Abuja Tech Store - Store | 9jaVibeMall"), "Business title follows naming convention");
    assert(bizMeta.canonical === "https://www.9javibemall.com.ng/business/BIZ789", "Business canonical URL uses business_id");

    const bizJsonLdStr = generateBusinessJsonLd(sampleBusiness);
    const bizJsonLd = JSON.parse(bizJsonLdStr);
    assert(bizJsonLd["@type"] === "Store", "Business JSON-LD @type is Store");
    assert(bizJsonLd.address?.addressLocality === "Wuse 2", "Address locality is populated");
    assert(bizJsonLd.address?.addressCountry === "NG", "Country is NG");

    // TEST 11: Dynamic Environment Configuration API
    console.log("\n[11] Testing Dynamic API Configuration (/api/config.js & /api/config)...");
    const configJs = await request("/api/config.js");
    assert(configJs.status === 200, "/api/config.js returns HTTP 200");
    assert(configJs.headers["content-type"].includes("application/javascript"), "/api/config.js Content-Type is application/javascript");
    assert(configJs.body.includes("window.__ENV__.API_BASE_URL"), "/api/config.js injects window.__ENV__.API_BASE_URL");

    const configJson = await request("/api/config?format=json");
    assert(configJson.status === 200, "/api/config?format=json returns HTTP 200");
    assert(configJson.headers["content-type"].includes("application/json"), "/api/config?format=json Content-Type is application/json");
    const parsedConfig = JSON.parse(configJson.body);
    // TEST 12: Static Assets and Fallback Handler
    console.log("\n[12] Testing Static Assets and Fallback Handler (/assets/* and /api/assets)...");
    const cssRes = await request("/assets/styles.css");
    assert(cssRes.status === 200, "/assets/styles.css returns HTTP 200");
    assert(cssRes.headers["content-type"].includes("text/css"), "/assets/styles.css Content-Type is text/css");
    assert(cssRes.body.includes(":root"), "/assets/styles.css contains design system tokens");

    const jsRes = await request("/assets/app.js");
    assert(jsRes.status === 200, "/assets/app.js returns HTTP 200");
    assert(jsRes.headers["content-type"].includes("javascript"), "/assets/app.js Content-Type is javascript");

    const apiAssetRes = await request("/api/assets?file=styles.css");
    assert(apiAssetRes.status === 200, "/api/assets?file=styles.css returns HTTP 200");
    assert(apiAssetRes.headers["content-type"].includes("text/css"), "/api/assets?file=styles.css Content-Type is text/css");

    console.log("\n========================================");
    console.log(`Results: ${passedCount} PASSED, ${failedCount} FAILED`);
    console.log("========================================");

    if (failedCount > 0) {
      process.exit(1);
    }
  } finally {
    server.close();
  }
}

runTests().catch(err => {
  console.error("Test execution error:", err);
  process.exit(1);
});
