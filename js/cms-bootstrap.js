// Career Pakistan — cms-bootstrap.js  (v2)
// ============================================================
// CRITICAL: Load this as the VERY FIRST <script> on every page.
// No defer. No async. Synchronous only.
//
// BUG FIX #4 (master prompt):
//   Dark mode is now applied instantly at bootstrap time so it
//   persists on EVERY page without a flash of light mode.
// ============================================================

(function () {
  'use strict';

  if (window._CMS_BOOTSTRAP_DONE) return;
  window._CMS_BOOTSTRAP_DONE = true;

  window.CMS_DATA               = window.CMS_DATA || {};
  window._CMS_READY             = window._CMS_READY || false;
  window._CMS_CALLBACKS         = window._CMS_CALLBACKS || [];
  window._CMS_REFRESH_LISTENERS = window._CMS_REFRESH_LISTENERS || [];

  // ── Public API ─────────────────────────────────────────────
  window.onCMSReady = function (fn) {
    if (typeof fn !== 'function') return;
    if (window._CMS_READY) {
      try { fn(window.CMS_DATA); } catch (e) { console.error('[CMS] onCMSReady callback error:', e); }
      return;
    }
    window._CMS_CALLBACKS.push(fn);
  };

  window.onCMSRefresh = function (fn) {
    if (typeof fn !== 'function') return;
    window._CMS_REFRESH_LISTENERS.push(fn);
  };

  // ── Internal fire functions (called by google-sheet-loader.js) ──
  window._fireCMSReady = function () {
    if (window._CMS_READY) return;
    window._CMS_READY = true;
    var callbacks = (window._CMS_CALLBACKS || []).slice();
    window._CMS_CALLBACKS = [];
    callbacks.forEach(function (fn) {
      try { fn(window.CMS_DATA); } catch (e) { console.error('[CMS] Ready callback error:', e); }
    });
    document.dispatchEvent(new CustomEvent('cmsReady', { detail: window.CMS_DATA }));
  };

  window._fireCMSRefresh = function (changedTabs) {
    (window._CMS_REFRESH_LISTENERS || []).forEach(function (fn) {
      try { fn(window.CMS_DATA, changedTabs || []); } catch (e) { console.error('[CMS] Refresh callback error:', e); }
    });
    document.dispatchEvent(new CustomEvent('cmsRefresh', {
      detail: { data: window.CMS_DATA, changed: changedTabs || [] }
    }));
  };

  window.registerMultiTabRefresh = function (cb) { window.onCMSRefresh(cb); };

  window._CMS_LOADER_PROMISE = window._CMS_LOADER_PROMISE || null;
  window._CMS_SHEETS_LOADED = window._CMS_SHEETS_LOADED || {};

  window._ensureCmsLoader = function () {
    if (typeof window.loadAllSheets === 'function') return Promise.resolve();
    if (window._CMS_LOADER_PROMISE) return window._CMS_LOADER_PROMISE;

    var existing = document.querySelector('script[src*="google-sheet-loader.js"]');
    if (existing) {
      window._CMS_LOADER_PROMISE = new Promise(function (resolve, reject) {
        if (typeof window.loadAllSheets === 'function') return resolve();
        existing.addEventListener('load', function () { resolve(); }, { once: true });
        existing.addEventListener('error', function (evt) { console.error('[CMS] google-sheet-loader.js failed to load', evt); reject(evt); }, { once: true });
      });
      return window._CMS_LOADER_PROMISE;
    }

    window._CMS_LOADER_PROMISE = new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.src = 'js/google-sheet-loader.js';
      script.defer = true;
      script.onload = function () { resolve(); };
      script.onerror = function (evt) { console.error('[CMS] Failed to load google-sheet-loader.js', evt); reject(evt); };
      (document.head || document.documentElement).appendChild(script);
    });
    return window._CMS_LOADER_PROMISE;
  };

  window.waitForCMSData = function (requiredSheets, options) {
    options = Object.assign({ timeout: 8000, interval: 120 }, options || {});
    var sheets = [];
    if (Array.isArray(requiredSheets)) sheets = requiredSheets.slice();
    else if (typeof requiredSheets === 'string') sheets = [requiredSheets];
    sheets = sheets.map(function (s) { return String(s || '').trim(); }).filter(Boolean);

    var hasSheet = function (name) {
      if (!window.CMS_DATA) return false;
      if (window._CMS_READY) {
        if (Array.isArray(window.CMS_DATA[name])) return true;
        var key = String(name || '').toLowerCase();
        return Array.isArray(window.CMS_DATA[key]);
      }
      if (Array.isArray(window.CMS_DATA[name]) && window._CMS_SHEETS_LOADED[name]) return true;
      var key = String(name || '').toLowerCase();
      return Array.isArray(window.CMS_DATA[key]) && window._CMS_SHEETS_LOADED[key];
    };

    var ready = function () {
      if (sheets.length === 0) {
        return window._CMS_READY || (window.CMS_DATA && Object.keys(window.CMS_DATA).some(function (key) { return Array.isArray(window.CMS_DATA[key]); }));
      }
      return sheets.every(hasSheet);
    };

    return window._ensureCmsLoader().catch(function (err) {
      console.warn('[CMS] No loader available, continuing with existing CMS_DATA', err);
    }).then(function () {
      if (ready()) return window.CMS_DATA || {};
      return new Promise(function (resolve) {
        var start = Date.now();
        var check = function () {
          if (ready()) {
            resolve(window.CMS_DATA || {});
            return;
          }
          if (Date.now() - start >= options.timeout) {
            console.warn('[CMS] waitForCMSData timeout for sheets:', sheets.join(', '), 'available:', Object.keys(window.CMS_DATA || {}).filter(function (key) { return Array.isArray(window.CMS_DATA[key]); }).join(', '));
            document.dispatchEvent(new CustomEvent('cmsLoadFailed', {
              detail: { requiredSheets: sheets, availableSheets: Object.keys(window.CMS_DATA || {}).filter(function (key) { return Array.isArray(window.CMS_DATA[key]); }) }
            }));
            resolve(window.CMS_DATA || {});
            return;
          }
          setTimeout(check, options.interval);
        };
        check();
      });
    });
  };

  // ── BUG FIX #4: Apply dark mode instantly (no flash) ────────
  // Step 1: add style rule immediately so body starts dark before paint
  if (localStorage.getItem('ch_dark') === 'true') {
    var styleTag = document.createElement('style');
    styleTag.textContent = 'body{background:#0f172a!important;color:#f1f5f9!important}';
    (document.head || document.documentElement).appendChild(styleTag);
  }

  // Step 2: sync body.dark class and icon once DOM exists
  document.addEventListener('DOMContentLoaded', function () {
    if (localStorage.getItem('ch_dark') === 'true') {
      document.body.classList.add('dark');
      var btn = document.getElementById('themeBtn');
      if (btn) btn.innerHTML = '<i class="fa fa-sun"></i>';
    }
  });

})();
