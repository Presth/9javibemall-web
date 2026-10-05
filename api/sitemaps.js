const {
  fetchProductsList,
  fetchBusinessesList,
  fetchCategories,
} = require("../lib/api");
const { CANONICAL_HOST, toW3CDate } = require("../lib/seo");

const CHUNK_SIZE = 1000;

function formatUrlEntry({ loc, lastmod, changefreq = "weekly", priority = "0.8" }) {
  let entry = `  <url>\n    <loc>${loc}</loc>`;
  if (lastmod) {
    const formatted = toW3CDate(lastmod);
    if (formatted) entry += `\n    <lastmod>${formatted}</lastmod>`;
  }
  if (changefreq) entry += `\n    <changefreq>${changefreq}</changefreq>`;
  if (priority) entry += `\n    <priority>${priority}</priority>`;
  entry += `\n  </url>`;
  return entry;
}

module.exports = async function handler(req, res) {
  let file = req.query.file;
  if (!file && req.url) {
    const segments = req.url.split("?")[0].split("/").filter(Boolean);
    const idx = segments.indexOf("sitemaps");
    if (idx !== -1 && segments.length > idx + 1) {
      file = segments[idx + 1];
    }
  }

  if (!file) {
    res.status(404).send("Sitemap not found");
    return;
  }

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");

  try {
    // 1. Static Public Pages Sitemap
    if (file === "pages.xml") {
      const today = new Date().toISOString().split("T")[0];
      const pages = [
        { loc: `${CANONICAL_HOST}/`, lastmod: today, changefreq: "daily", priority: "1.0" },
        { loc: `${CANONICAL_HOST}/contact`, lastmod: today, changefreq: "monthly", priority: "0.5" },
      ];

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(formatUrlEntry).join("\n")}
</urlset>`;
      return res.status(200).send(xml);
    }

    // 2. Categories Sitemap
    if (file === "categories.xml") {
      const categories = await fetchCategories();
      const urls = categories.map(cat => {
        const rawName = typeof cat === "string" ? cat : (cat.slug || cat.name || "");
        const slug = encodeURIComponent(String(rawName).toLowerCase().replace(/\s+/g, "-"));
        return {
          loc: `${CANONICAL_HOST}/category/${slug}`,
          changefreq: "weekly",
          priority: "0.7",
        };
      });

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(formatUrlEntry).join("\n")}
</urlset>`;
      return res.status(200).send(xml);
    }

    // 3. Products Chunk Sitemap (e.g. products-1.xml, products-2.xml)
    const productMatch = file.match(/^products-(\d+)\.xml$/);
    if (productMatch) {
      const page = parseInt(productMatch[1], 10) || 1;
      const { items: products } = await fetchProductsList({
        page,
        perPage: CHUNK_SIZE,
        status: true,
      });

      const urls = products.map(p => ({
        loc: `${CANONICAL_HOST}/product/${encodeURIComponent(p.slug || p.id)}`,
        lastmod: p.updatedAt || p.createdAt || null,
        changefreq: "weekly",
        priority: "0.8",
      }));

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(formatUrlEntry).join("\n")}
</urlset>`;
      return res.status(200).send(xml);
    }

    // 4. Businesses Chunk Sitemap (e.g. businesses-1.xml)
    const businessMatch = file.match(/^businesses-(\d+)\.xml$/);
    if (businessMatch) {
      const page = parseInt(businessMatch[1], 10) || 1;
      const { items: businesses } = await fetchBusinessesList({
        page,
        perPage: CHUNK_SIZE,
      });

      const urls = businesses.map(b => ({
        loc: `${CANONICAL_HOST}/business/${encodeURIComponent(b.business_id || b.id)}`,
        lastmod: b.updatedAt || b.createdAt || null,
        changefreq: "weekly",
        priority: "0.8",
      }));

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(formatUrlEntry).join("\n")}
</urlset>`;
      return res.status(200).send(xml);
    }

    res.status(404).send(`<?xml version="1.0" encoding="UTF-8"?>
<error>Sitemap file not found</error>`);
  } catch (err) {
    console.error("[Sitemaps Handler] Error:", err);
    res.status(500).send(`<?xml version="1.0" encoding="UTF-8"?>
<error>Failed to generate sitemap</error>`);
  }
};
