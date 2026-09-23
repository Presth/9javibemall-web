# 9jaVibeMall Complete Deep Linking & Website Fallback Walkthrough

A complete, production-ready **deep linking, Android App Links, iOS Universal Links, canonical HTTPS sharing, and website fallback system** has been implemented for 9jaVibeMall (`https://9javibemall.com.ng`).

---

## 1. Summary of Changes

### A. Existing Expo Custom Scheme Preservation
- **Scheme**: `naijavibemall` is strictly preserved in `9jaVibeMall/app.json`.
- Continues to support internal/testing links:
  - `naijavibemall://product/{id}`
  - `naijavibemall://business/{id}`

### B. Canonical HTTPS Sharing
- **Centralized Configuration**: Created [`config/urls.ts`](file:///c:/Users/peaks/Development/9jaVibeMall/config/urls.ts):
  - `WEB_BASE_URL = 'https://9javibemall.com.ng'`
  - `getProductUrl(id)` &rarr; `https://9javibemall.com.ng/product/{id}`
  - `getBusinessUrl(id)` &rarr; `https://9javibemall.com.ng/business/{id}`
  - `PLAY_STORE_URL` & `APP_STORE_URL`
- **Product Screen Share**:
  - Updated [`app/buyer/(tabs)/home/product/[id].tsx`](file:///c:/Users/peaks/Development/9jaVibeMall/app/buyer/(tabs)/home/product/[id].tsx) with `handleShareProduct` generating `Check out this product on 9jaVibeMall:\n\nhttps://9javibemall.com.ng/product/{id}`.
  - Added Share action button to [`components/elements/products/ProductPageHeader.jsx`](file:///c:/Users/peaks/Development/9jaVibeMall/components/elements/products/ProductPageHeader.jsx).
- **Business Screen Share**:
  - Updated [`app/buyer/(tabs)/home/business/[id].tsx`](file:///c:/Users/peaks/Development/9jaVibeMall/app/buyer/(tabs)/home/business/[id].tsx) with `handleShareBusiness` generating `Check out {business.name} on 9jaVibeMall:\nhttps://9javibemall.com.ng/business/{id}`.
  - Hardened back button with cold-start fallback `router.canGoBack() ? router.back() : router.replace("/buyer/home")`.

### C. Top-Level Expo Router Routes
- Created [`app/product/[id].tsx`](file:///c:/Users/peaks/Development/9jaVibeMall/app/product/[id].tsx) re-exporting `ProductDetails` without duplication.
- Created [`app/business/[id].tsx`](file:///c:/Users/peaks/Development/9jaVibeMall/app/business/[id].tsx) re-exporting `BusinessDetail` without duplication.
- Registered both routes in [`app/_layout.jsx`](file:///c:/Users/peaks/Development/9jaVibeMall/app/_layout.jsx) root stack navigator.

### D. Android App Links & iOS Universal Links Configuration
- [`9jaVibeMall/app.json`](file:///c:/Users/peaks/Development/9jaVibeMall/app.json):
  - `ios.bundleIdentifier`: `"com.stellarisnovatech.naijavibemall"`
  - `ios.associatedDomains`: `["applinks:9javibemall.com.ng"]`
  - `android.package`: `"com.stellarisnovatech.naijavibemall"`
  - `android.intentFilters`: Added `autoVerify: true` for `https://9javibemall.com.ng/product` and `https://9javibemall.com.ng/business`.
- [`9jaVibeMall/android/app/src/main/AndroidManifest.xml`](file:///c:/Users/peaks/Development/9jaVibeMall/android/app/src/main/AndroidManifest.xml):
  - Added autoVerify intent filter for Android App Links alongside the existing `naijavibemall` scheme filter.

### E. Web Fallback System (`9javibemall-web`)
Created the full website structure at [`9javibemall-web/`](file:///c:/Users/peaks/Development/9javibemall-web):
1. [`.well-known/assetlinks.json`](file:///c:/Users/peaks/Development/9javibemall-web/.well-known/assetlinks.json):
   - Package: `com.stellarisnovatech.naijavibemall`
   - Production SHA-256 fingerprint placeholder with clear documentation.
2. [`.well-known/apple-app-site-association`](file:///c:/Users/peaks/Development/9javibemall-web/.well-known/apple-app-site-association):
   - Modern format without `.json` extension.
   - App IDs with `<APPLE_TEAM_ID>.com.stellarisnovatech.naijavibemall`.
   - Mapped paths: `/product/*` and `/business/*`.
3. [`index.html`](file:///c:/Users/peaks/Development/9javibemall-web/index.html):
   - 9jaVibeMall branded landing page with platform detection (Android, iOS, Desktop), store download buttons, and Open App action.
4. [`product/index.html`](file:///c:/Users/peaks/Development/9javibemall-web/product/index.html):
   - Fetches product data dynamically from `https://api.9javibemall.com.ng/api/v1/products/{id}`.
   - Displays product images, title, price, discount badge, vendor store link, and description.
   - Open in 9jaVibeMall button (`naijavibemall://product/{id}`).
   - Dynamic platform download button.
   - Rich Open Graph / Twitter Card social metadata.
   - Skeleton loader and graceful error state.
5. [`business/index.html`](file:///c:/Users/peaks/Development/9javibemall-web/business/index.html):
   - Fetches business store data from `https://api.9javibemall.com.ng/api/v1/business/{id}` and items from `/business/products/{id}`.
   - Displays store banner, logo, name, verified badge, location, and product grid.
   - Open Store in 9jaVibeMall button (`naijavibemall://business/{id}`).
   - Dynamic platform download button.
   - Open Graph / Twitter Card metadata.
6. Hosting configuration:
   - [`_redirects`](file:///c:/Users/peaks/Development/9javibemall-web/_redirects) (Netlify & Cloudflare Pages rewrites)
   - [`_headers`](file:///c:/Users/peaks/Development/9javibemall-web/_headers) (MIME types for `.well-known` files)
   - [`vercel.json`](file:///c:/Users/peaks/Development/9javibemall-web/vercel.json) (Vercel rewrites and CORS headers)
7. [`README.md`](file:///c:/Users/peaks/Development/9javibemall-web/README.md):
   - Detailed deployment manual, verification commands, and certificate fingerprint instructions.

---

## 2. Verification Results

| Test / Check | Target | Result |
| :--- | :--- | :--- |
| **JSON Syntax** | `app.json`, `assetlinks.json`, `apple-app-site-association`, `vercel.json` | **Valid JSON** |
| **XML Syntax** | `android/app/src/main/AndroidManifest.xml` | **Valid XML** |
| **TypeScript Compilation** | `9jaVibeMall` application source files | **Zero errors in modified files** |
| **GET `/.well-known/assetlinks.json`** | Local HTTP test server | **HTTP 200, `application/json`** |
| **GET `/.well-known/apple-app-site-association`** | Local HTTP test server | **HTTP 200, `application/json`** |
| **GET `/`** | Local HTTP test server | **HTTP 200, `text/html`** |
| **GET `/product/test-prod-123`** | Local HTTP test server | **HTTP 200, `text/html`** |
| **GET `/business/test-biz-456`** | Local HTTP test server | **HTTP 200, `text/html`** |
| **URL Generators** | `config/urls.ts` | **Correct canonical HTTPS & scheme URLs** |

---

## 3. Production Deployment Checklist for User

Before pushing to production `https://9javibemall.com.ng`:

1. **Android SHA-256 Fingerprint**:
   - In Google Play Console &rarr; **Release** &rarr; **Setup** &rarr; **App Integrity**, copy the **App signing key certificate SHA-256 fingerprint**.
   - Paste it into `9javibemall-web/.well-known/assetlinks.json` replacing `PUT_ACTUAL_PRODUCTION_SHA256_FINGERPRINT_HERE`.
2. **Apple Team ID**:
   - In your Apple Developer Account, find your 10-character Team ID.
   - Replace `<APPLE_TEAM_ID>` in `9javibemall-web/.well-known/apple-app-site-association`.
3. **App Store URL**:
   - Replace `YOUR_APP_STORE_ID` in `9javibemall-web/assets/app.js` and `9jaVibeMall/config/urls.ts` once published to Apple App Store.
4. **Deploy Web App**:
   - Deploy `9javibemall-web/` to your web host (Vercel, Netlify, Cloudflare Pages, or Nginx) serving `https://9javibemall.com.ng`.
   - Verify:
     ```bash
     curl -I https://9javibemall.com.ng/.well-known/assetlinks.json
     curl -I https://9javibemall.com.ng/.well-known/apple-app-site-association
     ```
