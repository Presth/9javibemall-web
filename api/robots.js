const { CANONICAL_HOST } = require("../lib/seo");

module.exports = function handler(req, res) {
  const robots = `# 9jaVibeMall Robots.txt
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

  res.status(200);
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=604800");
  return res.send(robots);
};
