/**
 * 9jaVibeMall Web Fallback Client Script
 * Handles platform detection, app installation intent, and deep-link redirection.
 */

const CONFIG = {
  appName: "9jaVibeMall",
  scheme: "naijavibemall",
  playStoreUrl: "https://play.google.com/store/apps/details?id=com.stellarisnovatech.naijavibemall",
  appStoreUrl: "https://apps.apple.com/app/9javibemall/idYOUR_APP_STORE_ID", // Production placeholder
  apiBaseUrl: "https://api.9javibemall.com.ng/api/v1",
};

/**
 * Detect client platform (iOS, Android, or Desktop)
 */
function getPlatform() {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera || "";

  if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
    return "ios";
  }
  if (/android/i.test(userAgent)) {
    return "android";
  }
  return "desktop";
}

/**
 * Return download URL matching current platform
 */
function getDownloadUrl() {
  const platform = getPlatform();
  if (platform === "ios") return CONFIG.appStoreUrl;
  if (platform === "android") return CONFIG.playStoreUrl;
  return CONFIG.playStoreUrl; // default
}

/**
 * Attempt to open the custom scheme, with polite fallback if app is not installed
 */
function triggerAppOpen(customSchemeUrl, fallbackDownload = false) {
  const startTime = Date.now();
  window.location.href = customSchemeUrl;

  if (fallbackDownload) {
    setTimeout(() => {
      // If the user remains in browser without switching away after 2 seconds, redirect to store
      if (Date.now() - startTime < 2500) {
        window.location.href = getDownloadUrl();
      }
    }, 1800);
  }
}

/**
 * Update UI buttons with detected platform specifics
 */
function setupPlatformUI() {
  const platform = getPlatform();
  const downloadLinks = document.querySelectorAll(".dynamic-download-btn");
  const platformNotice = document.getElementById("platform-notice");

  downloadLinks.forEach((link) => {
    link.href = getDownloadUrl();
    if (platform === "ios") {
      link.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.61-.75 1.04-1.8 1.01-2.87-.96.04-2.13.65-2.8 1.43-.59.68-1.11 1.76-1.03 2.81 1.07.08 2.19-.57 2.82-1.37z"/></svg>
        Download on App Store
      `;
    } else if (platform === "android") {
      link.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M3.609 1.814L13.792 12 3.61 22.186a2.404 2.404 0 0 1-.61-.318 2.38 2.38 0 0 1-.999-1.928V4.06c0-.77.37-1.487.999-1.928.188-.13.397-.24.609-.318zm11.235 11.238l2.25 2.25-11.758 6.786 9.508-9.036zm0-2.104L5.336 1.912 17.094 8.7l-2.25 2.248zm1.096 1.052l3.414 1.968c1.334.77 1.334 2.03 0 2.8l-3.414 1.97-2.316-2.316 2.316-2.422z"/></svg>
        Get it on Google Play
      `;
    } else {
      link.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
        Get the Mobile App
      `;
    }
  });

  if (platformNotice) {
    if (platform === "desktop") {
      platformNotice.innerText = "For the best shopping experience, download 9jaVibeMall on your mobile device.";
    } else {
      platformNotice.innerText = "Have the app? Open directly for express checkout and exclusive mobile deals.";
    }
  }
}

document.addEventListener("DOMContentLoaded", setupPlatformUI);
