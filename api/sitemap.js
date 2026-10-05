const { fetchProductsList, fetchBusinessesList } = require("../lib/api");
const { CANONICAL_HOST, toW3CDate } = require("../lib/seo");

const CHUNK_SIZE = 1000;

module.exports = async function handler(req, res) {
  try {
    // Determine total products and businesses count to generate dynamic index chunks
    const [productsRes, businessesRes] = await Promise.all([
      fetchProductsList({ page: 1, perPage: 1, status: true }),
      fetchBusinessesList({ page: 1, perPage: 1 }),
    ]);

    const totalProducts = productsRes?.meta?.total || 0;
    const totalBusinesses = businessesRes?.meta?.total || 0;

    const productChunks = Math.max(1, Math.ceil(totalProducts / CHUNK_SIZE));
    const businessChunks = Math.max(1, Math.ceil(totalBusinesses / CHUNK_SIZE));

    const today = new Date().toISOString().split("T")[0];

    const sitemaps = [
      `${CANONICAL_HOST}/sitemaps/pages.xml`,
      `${CANONICAL_HOST}/sitemaps/categories.xml`,
    ];

    for (let i = 1; i <= businessChunks; i++) {
      sitemaps.push(`${CANONICAL_HOST}/sitemaps/businesses-${i}.xml`);
    }

    for (let i = 1; i <= productChunks; i++) {
      sitemaps.push(`${CANONICAL_HOST}/sitemaps/products-${i}.xml`);
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps
  .map(
    url => `  <sitemap>
    <loc>${url}</loc>
    <lastmod>${today}</lastmod>
  </sitemap>`
  )
  .join("\n")}
</sitemapindex>`;

    res.status(200);
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
    return res.send(xml);
  } catch (err) {
    console.error("[Sitemap Index] Error:", err);
    // Graceful fallback to single sitemap if API is unreachable
    const fallbackXml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${CANONICAL_HOST}/sitemaps/pages.xml</loc>
  </sitemap>
  <sitemap>
    <loc>${CANONICAL_HOST}/sitemaps/businesses-1.xml</loc>
  </sitemap>
  <sitemap>
    <loc>${CANONICAL_HOST}/sitemaps/products-1.xml</loc>
  </sitemap>
</sitemapindex>`;
    res.status(200);
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    return res.send(fallbackXml);
  }
};
