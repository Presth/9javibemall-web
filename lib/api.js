/**
 * Centralized API client for 9jaVibeMall Web
 * Supports primary production API with fallback API failover and in-memory caching.
 */

const PRIMARY_API =
  process.env.API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://api.9javibemall.com.ng/api/v1";
const FALLBACK_API =
  process.env.FALLBACK_API_BASE_URL ||
  "https://ready9ja-api.onrender.com/api/v1";

// In-memory cache to reduce API load during crawler visits
const cache = new Map();
const DEFAULT_TTL_MS = 60 * 1000; // 60 seconds

function getCached(key) {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    cache.delete(key);
    return null;
  }
  return item.data;
}

function setCached(key, data, ttlMs = DEFAULT_TTL_MS) {
  cache.set(key, {
    data,
    expiresAt: Date.now() + ttlMs,
  });
}

/**
 * Execute HTTP GET request with automatic failover between primary and fallback APIs.
 */
async function requestWithFailover(path, options = {}) {
  const timeoutMs = options.timeout || 8000;

  async function fetchFrom(baseUrl) {
    const url = `${baseUrl.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, {
        headers: {
          Accept: "application/json",
          "User-Agent": "9jaVibeMall-Web-SSR/2.0",
        },
        signal: controller.signal,
      });
      clearTimeout(timer);
      return res;
    } catch (err) {
      clearTimeout(timer);
      throw err;
    }
  }

  // Attempt primary API
  try {
    const res = await fetchFrom(PRIMARY_API);
    if (res.status === 404) return { status: 404, data: null };
    if (res.ok) {
      const data = await res.json();
      return { status: 200, data };
    }
  } catch (primaryErr) {
    // Primary failed, log and attempt fallback
    console.warn(`[API] Primary API error on ${path}:`, primaryErr.message);
  }

  // Attempt fallback API if primary was not a clean 404
  if (FALLBACK_API && FALLBACK_API !== PRIMARY_API) {
    try {
      const res = await fetchFrom(FALLBACK_API);
      if (res.status === 404) return { status: 404, data: null };
      if (res.ok) {
        const data = await res.json();
        return { status: 200, data };
      }
    } catch (fallbackErr) {
      console.warn(`[API] Fallback API error on ${path}:`, fallbackErr.message);
    }
  }

  return { status: 500, data: null };
}

/**
 * Fetch a single product by slug or UUID
 */
async function fetchProduct(slugOrId) {
  if (!slugOrId) return null;
  const cacheKey = `product:${slugOrId}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);

  // If slug, try slug endpoint first; if UUID, try /products/:id
  let result;
  if (isUuid) {
    result = await requestWithFailover(`products/${encodeURIComponent(slugOrId)}`);
  } else {
    result = await requestWithFailover(`products/slug/${encodeURIComponent(slugOrId)}`);
    if (result.status === 404) {
      // Fallback to /products/:id in case endpoint structure is unified
      result = await requestWithFailover(`products/${encodeURIComponent(slugOrId)}`);
    }
  }

  if (result.status === 200 && result.data) {
    const product = result.data.product || result.data.data || result.data;
    if (product && (product.id || product.productId || product.name)) {
      product.id = product.id || product.productId || product.uuid;
      setCached(cacheKey, product, 60 * 1000);
      return product;
    }
  }

  return null;
}

/**
 * Fetch a single business by business_id or numeric ID
 */
async function fetchBusiness(id) {
  if (!id) return null;
  const cacheKey = `business:${id}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const result = await requestWithFailover(`business/${encodeURIComponent(id)}`);

  if (result.status === 200 && result.data) {
    const business = result.data.business || result.data.data || result.data;
    if (business && (business.id || business.business_id || business.name)) {
      business.id = business.id || business.business_id || business.uuid;
      setCached(cacheKey, business, 60 * 1000);
      return business;
    }
  }

  return null;
}

/**
 * Fetch products belonging to a business
 */
async function fetchBusinessProducts(businessId, limit = 12) {
  if (!businessId) return [];
  const cacheKey = `biz-products:${businessId}:${limit}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  // Try /business/products/:id first, then /products?businessId=:id
  let result = await requestWithFailover(`business/products/${encodeURIComponent(businessId)}?perPage=${limit}`);
  if (result.status !== 200 || !result.data) {
    result = await requestWithFailover(`products?businessId=${encodeURIComponent(businessId)}&perPage=${limit}`);
  }

  if (result.status === 200 && result.data) {
    const products = Array.isArray(result.data.data)
      ? result.data.data
      : Array.isArray(result.data.products)
      ? result.data.products
      : Array.isArray(result.data)
      ? result.data
      : [];
    setCached(cacheKey, products, 60 * 1000);
    return products;
  }

  return [];
}

/**
 * Fetch paginated list of public products (for sitemaps and category feeds)
 */
async function fetchProductsList({ page = 1, perPage = 100, status = true, category = "" } = {}) {
  const cacheKey = `products:list:${page}:${perPage}:${status}:${category}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const params = new URLSearchParams({
    page: String(page),
    perPage: String(perPage),
    status: String(status),
  });
  if (category) params.append("category", category);

  const result = await requestWithFailover(`products?${params.toString()}`);

  if (result.status === 200 && result.data) {
    const items = Array.isArray(result.data.data)
      ? result.data.data
      : Array.isArray(result.data.products)
      ? result.data.products
      : Array.isArray(result.data)
      ? result.data
      : [];

    const meta = result.data.meta || {
      total: items.length,
      page,
      perPage,
      totalPages: Math.ceil(items.length / perPage) || 1,
    };

    const payload = { items, meta };
    setCached(cacheKey, payload, 300 * 1000); // 5 min TTL for sitemap queries
    return payload;
  }

  return { items: [], meta: { total: 0, page, perPage, totalPages: 0 } };
}

/**
 * Fetch paginated list of public approved businesses
 */
async function fetchBusinessesList({ page = 1, perPage = 100 } = {}) {
  const cacheKey = `business:list:${page}:${perPage}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const params = new URLSearchParams({
    page: String(page),
    perPage: String(perPage),
  });

  const result = await requestWithFailover(`business?${params.toString()}`);

  if (result.status === 200 && result.data) {
    const items = Array.isArray(result.data.data)
      ? result.data.data
      : Array.isArray(result.data.businesses)
      ? result.data.businesses
      : Array.isArray(result.data)
      ? result.data
      : [];

    const meta = result.data.meta || {
      total: items.length,
      page,
      perPage,
      totalPages: Math.ceil(items.length / perPage) || 1,
    };

    const payload = { items, meta };
    setCached(cacheKey, payload, 300 * 1000);
    return payload;
  }

  return { items: [], meta: { total: 0, page, perPage, totalPages: 0 } };
}

/**
 * Fetch public business categories
 */
async function fetchCategories() {
  const cacheKey = "categories:list";
  const cached = getCached(cacheKey);
  if (cached) return cached;

  let result = await requestWithFailover("business-categories");
  if (result.status !== 200) {
    result = await requestWithFailover("business/categories");
  }

  if (result.status === 200 && result.data) {
    const categories = Array.isArray(result.data.data)
      ? result.data.data
      : Array.isArray(result.data)
      ? result.data
      : [];
    setCached(cacheKey, categories, 600 * 1000);
    return categories;
  }

  return [];
}

module.exports = {
  fetchProduct,
  fetchBusiness,
  fetchBusinessProducts,
  fetchProductsList,
  fetchBusinessesList,
  fetchCategories,
  getApiBaseUrl: () => PRIMARY_API,
};
