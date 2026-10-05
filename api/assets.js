/**
 * Dynamic Asset Serving Fallback for 9jaVibeMall Web
 * Ensures styles, scripts, and media are reliably served even if static host routing fails.
 */

const fs = require("fs");
const path = require("path");

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".json": "application/json; charset=utf-8",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".txt": "text/plain; charset=utf-8",
};

module.exports = function handler(req, res) {
  let file = req.query.file;
  if (!file && req.url) {
    const urlParts = req.url.split("?")[0].split("/assets/");
    if (urlParts.length > 1) {
      file = urlParts[1];
    } else {
      const apiParts = req.url.split("?")[0].split("/api/assets");
      if (apiParts.length > 1 && apiParts[1]) {
        file = apiParts[1].replace(/^\/+/, "");
      }
    }
  }

  if (!file) {
    res.status(404);
    if (res.setHeader) res.setHeader("Content-Type", "text/plain; charset=utf-8");
    return res.send ? res.send("Asset not found") : res.end("Asset not found");
  }

  // Prevent directory traversal
  const safeFile = path.normalize(file).replace(/^(\.\.[\/\\])+/, "");

  // Look in assets/ first, then public/assets/
  let filePath = path.join(__dirname, "..", "assets", safeFile);
  if (!fs.existsSync(filePath)) {
    filePath = path.join(__dirname, "..", "public", "assets", safeFile);
  }

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.status(404);
    if (res.setHeader) res.setHeader("Content-Type", "text/plain; charset=utf-8");
    return res.send ? res.send(`Asset not found: ${safeFile}`) : res.end(`Asset not found: ${safeFile}`);
  }

  const ext = path.extname(filePath).toLowerCase();
  const mime = MIME_TYPES[ext] || "application/octet-stream";

  try {
    const data = fs.readFileSync(filePath);
    res.status(200);
    if (res.setHeader) {
      res.setHeader("Content-Type", mime);
      res.setHeader("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800");
      res.setHeader("Access-Control-Allow-Origin", "*");
    }
    return res.send ? res.send(data) : res.end(data);
  } catch (err) {
    console.error("[Assets Handler] Error reading file:", err);
    res.status(500);
    if (res.setHeader) res.setHeader("Content-Type", "text/plain; charset=utf-8");
    return res.send ? res.send("Error reading asset") : res.end("Error reading asset");
  }
};
