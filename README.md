# 9jaVibeMall Web Fallback & Deep Linking Association

This repository contains the production website fallback, product/business web landing pages, and `.well-known` association assets for **9jaVibeMall** (`https://9javibemall.com.ng`).

---

## 1. System Architecture

```text
User taps shared link (e.g. WhatsApp, X, Facebook, SMS)
                    │
                    ▼
       Canonical HTTPS URL
   https://9javibemall.com.ng/product/{id}
   https://9javibemall.com.ng/business/{id}
                    │
                    ▼
     ┌─────────────────────────────┐
     │  Operating System Checks:   │
     │  Is 9jaVibeMall installed   │
     │  and domain associated?     │
     └──────────────┬──────────────┘
                    │
             ┌──────┴──────┐
             │             │
            YES            NO
             │             │
             ▼             ▼
      App Launches    Web Browser
             │             │
             ▼             ▼
       Existing Route  Fallback View:
       /product/{id}   /product/{id}
       /business/{id}  /business/{id}
                           │
                           ├─► "Open in 9jaVibeMall" (naijavibemall://)
                           └─► "Download 9jaVibeMall" (Store listing)
```

---

## 2. Directory Structure

```text
9javibemall-web/
├── .well-known/
│   ├── assetlinks.json            # Android App Links association file
│   └── apple-app-site-association # iOS Universal Links association file (NO .json extension)
├── assets/
│   ├── app.js                     # Platform detection & deep link helper
│   ├── styles.css                 # 9jaVibeMall design system styles
│   └── logo.png                   # Official 9jaVibeMall brand icon
├── product/
│   └── index.html                 # Fallback view for /product/:id
├── business/
│   └── index.html                 # Fallback view for /business/:id
├── index.html                     # Official landing page for /
├── _redirects                     # Cloudflare Pages / Netlify route rewrites
├── _headers                       # Cloudflare Pages / Netlify MIME type headers
├── vercel.json                    # Vercel deployment rewrites and headers
└── README.md                      # Deployment & testing manual
```

---

## 3. Deployment Instructions

Deploy the contents of `9javibemall-web/` to the root of your web server / static host connected to `https://9javibemall.com.ng`.

### Requirements
1. **Strict HTTPS**: Both Android App Links and Apple Universal Links **require** HTTPS with a valid SSL/TLS certificate.
2. **Accessible `.well-known` directory**:
   - `https://9javibemall.com.ng/.well-known/assetlinks.json`
   - `https://9javibemall.com.ng/.well-known/apple-app-site-association`
   Both URLs must return HTTP status `200`, without redirects, with `Content-Type: application/json`, and must not be protected behind authentication.
3. **No `.json` on Apple file**: `apple-app-site-association` must **never** have a `.json` extension.

### Hosting Options

#### Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel deploy --prod` inside `9javibemall-web/`
3. Configure `9javibemall.com.ng` in Vercel project domain settings. The provided `vercel.json` automatically handles rewrites and headers.

#### Netlify / Cloudflare Pages
1. Push `9javibemall-web/` to your Git repository or upload folder directly.
2. Set publish directory to `.`.
3. The included `_redirects` and `_headers` files configure single-page rewrites and `.well-known` MIME types.

#### Nginx Configuration Snippet
```nginx
server {
    server_name 9javibemall.com.ng;
    root /var/www/9javibemall-web;
    index index.html;

    # Serve Apple App Site Association
    location = /.well-known/apple-app-site-association {
        default_type application/json;
        add_header Access-Control-Allow-Origin *;
    }

    # Serve Android Asset Links
    location = /.well-known/assetlinks.json {
        default_type application/json;
        add_header Access-Control-Allow-Origin *;
    }

    # Product route rewrite
    location ~* ^/product/.*$ {
        try_files /product/index.html =404;
    }

    # Business route rewrite
    location ~* ^/business/.*$ {
        try_files /business/index.html =404;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }

    listen 443 ssl http2;
    # (SSL certificate configuration...)
}
```

---

## 4. Android App Links Setup

### Package Name
The confirmed Android application ID is:
```text
com.stellarisnovatech.naijavibemall
```

### Production SHA-256 Certificate Fingerprint
The file `.well-known/assetlinks.json` currently contains a placeholder:
```json
"sha256_cert_fingerprints": [
  "PUT_ACTUAL_PRODUCTION_SHA256_FINGERPRINT_HERE"
]
```

#### How to Obtain the Production Fingerprint:
1. **Google Play Console** (Recommended if using Play App Signing):
   - Go to **Google Play Console** &rarr; Select your **9jaVibeMall** app.
   - In the left menu, navigate to **Release** &rarr; **Setup** &rarr; **App Integrity**.
   - Under the **App signing key certificate** tab, copy the **SHA-256 certificate fingerprint** (e.g. `14:6D:E9:...`).
2. **EAS Build** (If managed by EAS):
   - Run:
     ```bash
     eas credentials -p android
     ```
   - Select your project, inspect your Android Keystore, and copy the `SHA-256 Fingerprint`.

#### Updating `assetlinks.json`:
Replace `"PUT_ACTUAL_PRODUCTION_SHA256_FINGERPRINT_HERE"` in `.well-known/assetlinks.json` with your real fingerprint:
```json
[
  {
    "relation": [
      "delegate_permission/common.handle_all_urls"
    ],
    "target": {
      "namespace": "android_app",
      "package_name": "com.stellarisnovatech.naijavibemall",
      "sha256_cert_fingerprints": [
        "14:6D:E9:1F:B4:98:B4:26:73:96:37:1F:59:7D:66:E2:0F:78:16:D4:57:4E:99:99:8A:2F:3D:20:9B:6F:AA:11"
      ]
    }
  }
]
```
*(You may add multiple fingerprints, e.g. both Google Play App Signing key and upload key for development testing).*

---

## 5. iOS Universal Links Setup

### Bundle Identifier
The confirmed iOS Bundle Identifier is:
```text
com.stellarisnovatech.naijavibemall
```

### Apple Team ID
The file `.well-known/apple-app-site-association` currently contains:
```json
"appIDs": [
  "<APPLE_TEAM_ID>.com.stellarisnovatech.naijavibemall"
]
```

#### How to Obtain Your Apple Team ID:
1. Log into your [Apple Developer Account](https://developer.apple.com/account).
2. Go to **Membership details** or look at the top-right corner under your organization name.
3. Copy your 10-character **Team ID** (e.g., `8X93ABCD12`).
4. Replace `<APPLE_TEAM_ID>` in `.well-known/apple-app-site-association` so the string becomes:
   ```json
   "appIDs": [
     "8X93ABCD12.com.stellarisnovatech.naijavibemall"
   ]
   ```

---

## 6. App Store Listing URLs

- **Android (Google Play Store)**:
  ```text
  https://play.google.com/store/apps/details?id=com.stellarisnovatech.naijavibemall
  ```
- **iOS (Apple App Store)**:
  Replace the placeholder in `assets/app.js` and `config/urls.ts`:
  ```text
  https://apps.apple.com/app/9javibemall/id<YOUR_APP_STORE_NUMERIC_ID>
  ```

---

## 7. Custom Scheme Preservation

The existing Expo custom scheme is:
```text
naijavibemall
```
This scheme is **strictly preserved** and continues to support:
- `naijavibemall://product/123`
- `naijavibemall://business/456`

The custom scheme is used internally, for development/testing, and as a secondary browser fallback ("Open in 9jaVibeMall" button). **The public canonical URLs generated by the mobile app's Share buttons are strictly HTTPS.**

---

## 8. Verification & Testing

### Test `.well-known` Endpoints
After deployment to `https://9javibemall.com.ng`:

```bash
# Verify Android Asset Links
curl -I https://9javibemall.com.ng/.well-known/assetlinks.json

# Verify Apple App Site Association (Notice no .json extension)
curl -I https://9javibemall.com.ng/.well-known/apple-app-site-association
```
*Expected: HTTP 200, Content-Type application/json.*

### Test Android App Links via ADB
Build a release APK or development build (`npx expo run:android` or EAS build):

```bash
# 1. Trigger product deep link
adb shell am start -W -a android.intent.action.VIEW -d "https://9javibemall.com.ng/product/123" com.stellarisnovatech.naijavibemall

# 2. Trigger business deep link
adb shell am start -W -a android.intent.action.VIEW -d "https://9javibemall.com.ng/business/456" com.stellarisnovatech.naijavibemall

# 3. Verify App Link verification state on device
adb shell pm get-app-links com.stellarisnovatech.naijavibemall
```

### Test iOS Universal Links via Simulator
```bash
xcrun simctl openurl booted "https://9javibemall.com.ng/product/123"
```

### Note on Expo Go
*Android App Links and iOS Universal Links require OS-level domain verification and MUST be tested on a custom development build (`npx expo run:android` / `npx expo run:ios`) or standalone release build, rather than basic Expo Go.*
