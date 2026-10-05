/**
 * Dynamic configuration endpoint for 9jaVibeMall Web
 * Exposes server environment variables (like API_BASE_URL) to client-side scripts safely.
 */

module.exports = function handler(req, res) {
  const apiBaseUrl =
    process.env.API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "https://api.9javibemall.com.ng/api/v1";

  const isJson = (req.query && req.query.format === "json") || (req.headers && req.headers.accept && req.headers.accept.includes("application/json") && !req.url.endsWith(".js"));

  if (isJson) {
    if (res.setHeader) {
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    }
    const jsonStr = JSON.stringify({ API_BASE_URL: apiBaseUrl });
    return res.send ? res.send(jsonStr) : res.end(jsonStr);
  }

  if (res.setHeader) {
    res.setHeader("Content-Type", "application/javascript; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  }

  const jsContent = `window.__ENV__ = window.__ENV__ || {}; window.__ENV__.API_BASE_URL = ${JSON.stringify(apiBaseUrl)};`;
  return res.send ? res.send(jsContent) : res.end(jsContent);
};
