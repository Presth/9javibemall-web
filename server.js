/**
 * Standalone Local Server for 9jaVibeMall Web
 * Emulates Vercel routing, SSR serverless functions, and static assets locally.
 */

const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");

// Load .env if present
try {
  const envPath = path.join(__dirname, ".env");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf8");
    envContent.split(/\r?\n/).forEach((line) => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let val = match[2] || "";
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        process.env[key] = process.env[key] || val.trim();
      }
    });
  }
} catch (e) {}

const productHandler = require("./api/product");
const businessHandler = require("./api/business");
const categoryHandler = require("./api/category");
const sitemapIndexHandler = require("./api/sitemap");
const sitemapsChunkHandler = require("./api/sitemaps");
const robotsHandler = require("./api/robots");
const configHandler = require("./api/config");

const PORT = process.env.PORT || 3000;
const rootDir = __dirname;

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
};

// Polyfill Vercel/Express-like helpers on raw Node.js ServerResponse
function enhanceResponse(res) {
  res.status = function (code) {
    res.statusCode = code;
    return res;
  };
  res.send = function (body) {
    if (!res.getHeader("Content-Type")) {
      res.setHeader("Content-Type", typeof body === "object" ? "application/json" : "text/html; charset=utf-8");
    }
    res.end(typeof body === "object" ? JSON.stringify(body) : body);
    return res;
  };
  res.json = function (obj) {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify(obj));
    return res;
  };
}

function serveStaticFile(filePath, res, overrideMime) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("404 Not Found");
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const mime = overrideMime || MIME_TYPES[ext] || "application/octet-stream";
    res.writeHead(200, {
      "Content-Type": mime,
      "Access-Control-Allow-Origin": "*",
    });
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  enhanceResponse(res);
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname.replace(/\/+$/, "") || "/";
  req.query = parsedUrl.query || {};

  // 1. Apple App Site Association
  if (pathname === "/.well-known/apple-app-site-association") {
    return serveStaticFile(path.join(rootDir, ".well-known", "apple-app-site-association"), res, "application/json");
  }

  // 2. Android Asset Links
  if (pathname === "/.well-known/assetlinks.json") {
    return serveStaticFile(path.join(rootDir, ".well-known", "assetlinks.json"), res, "application/json");
  }

  // 3. Robots.txt
  if (pathname === "/robots.txt") {
    return robotsHandler(req, res);
  }

  // 4. Sitemap Index
  if (pathname === "/sitemap.xml") {
    return sitemapIndexHandler(req, res);
  }

  // 5. Sitemap Chunks
  const sitemapMatch = pathname.match(/^\/sitemaps\/([a-zA-Z0-9_-]+\.xml)$/);
  if (sitemapMatch) {
    req.query.file = sitemapMatch[1];
    return sitemapsChunkHandler(req, res);
  }

  // 6. Config Endpoint (Expose env var API_BASE_URL to browser)
  if (pathname === "/api/config.js" || pathname === "/api/config") {
    return configHandler(req, res);
  }

  // 7. Product SSR & Static Fallback
  if (pathname === "/product") {
    return serveStaticFile(path.join(rootDir, "product", "index.html"), res);
  }
  const productMatch = pathname.match(/^\/product\/(.+)$/);
  if (productMatch) {
    req.query.id = productMatch[1];
    return productHandler(req, res);
  }

  // 8. Business SSR & Static Fallback
  if (pathname === "/business") {
    return serveStaticFile(path.join(rootDir, "business", "index.html"), res);
  }
  const businessMatch = pathname.match(/^\/business\/(.+)$/);
  if (businessMatch) {
    req.query.id = businessMatch[1];
    return businessHandler(req, res);
  }

  // 8. Category SSR
  const categoryMatch = pathname.match(/^\/category\/(.+)$/);
  if (categoryMatch) {
    req.query.slug = categoryMatch[1];
    return categoryHandler(req, res);
  }

  // 9. Static assets
  if (pathname.startsWith("/assets/")) {
    const assetPath = path.join(rootDir, pathname);
    return serveStaticFile(assetPath, res);
  }

  // 10. Contact Page
  if (pathname === "/contact") {
    return serveStaticFile(path.join(rootDir, "contact", "index.html"), res);
  }

  // 11. Delete Account Page
  if (pathname === "/delete-account") {
    return serveStaticFile(path.join(rootDir, "delete-account", "index.html"), res);
  }

  // 12. Homepage
  if (pathname === "/") {
    return serveStaticFile(path.join(rootDir, "index.html"), res);
  }

  // Fallback 404
  res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
  res.end(`<!DOCTYPE html>
<html>
<head><title>404 Not Found | 9jaVibeMall</title></head>
<body style="font-family: sans-serif; text-align: center; padding: 3rem;">
  <h1>404 - Not Found</h1>
  <p>The requested page does not exist.</p>
  <a href="/">Go to Homepage</a>
</body>
</html>`);
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`9jaVibeMall Web server running at http://localhost:${PORT}`);
  });
}

module.exports = server;
