// src/utils/platform.js
import { Capacitor } from '@capacitor/core';

function uaLooksLikeWebView() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  // common webview hints: "wv" or "Android" + "Version/" (Android System WebView)
  // iOS webviews won't include "Safari"
  return /wv/.test(ua) || (/Android/.test(ua) && /Version\//.test(ua)) || (/iPhone|iPad|iPod/.test(ua) && !/Safari/.test(ua));
}

function detectNativeImmediate() {
  try {
    if (typeof Capacitor !== 'undefined' && Capacitor) {
      // Prefer getPlatform when available
      if (typeof Capacitor.getPlatform === 'function') {
        const p = Capacitor.getPlatform();
        // 'web' means not native; other values like 'android'|'ios' are native
        return p !== 'web';
      }
      // older Capacitor versions sometimes provide isNativePlatform
      if (typeof Capacitor.isNativePlatform === 'function') {
        return !!Capacitor.isNativePlatform();
      }
    }
  } catch (e) {
    // ignore
  }

  // Fallback heuristic: userAgent looks like webview (Android/iOS)
  try {
    if (uaLooksLikeWebView()) return true;
  } catch (e) {}

  return false;
}

export function isNativeApp() {
  return detectNativeImmediate();
}

export function initializePlatformStyles({ retry = true } = {}) {
  const native = detectNativeImmediate();
  console.log('[platform] detectNativeImmediate ->', native, { ua: (typeof navigator !== 'undefined' ? navigator.userAgent : '') });

  try {
    if (native) {
      document.body.classList.add('app-mode');
      // inject public/app-theme.css if not already present
      const href = '/app-theme.css';
      if (!document.querySelector(`link[href="${href}"]`)) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        link.onload = () => console.log('[platform] app-theme.css loaded');
        link.onerror = () => console.warn('[platform] failed to load app-theme.css');
        document.head.appendChild(link);
      } else {
        console.log('[platform] app-theme.css already present');
      }
    } else {
      document.body.classList.add('web-mode');
      // If this might be running inside the native app but Capacitor wasn't ready,
      // retry once after a small delay (useful for race conditions).
      if (retry) {
        setTimeout(() => {
          const secondTryNative = detectNativeImmediate();
          console.log('[platform] retry detection ->', secondTryNative);
          if (secondTryNative) {
            // remove web-mode in case it was added, then add app-mode and CSS
            document.body.classList.remove('web-mode');
            document.body.classList.add('app-mode');
            const href = '/app-theme.css';
            if (!document.querySelector(`link[href="${href}"]`)) {
              const link = document.createElement('link');
              link.rel = 'stylesheet';
              link.href = href;
              link.onload = () => console.log('[platform] app-theme.css loaded (retry)');
              link.onerror = () => console.warn('[platform] failed to load app-theme.css (retry)');
              document.head.appendChild(link);
            }
          }
        }, 300); // 300ms retry
      }
    }
  } catch (err) {
    console.error('[platform] initializePlatformStyles error', err);
  }

  return native;
}
