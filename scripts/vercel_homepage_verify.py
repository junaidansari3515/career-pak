#!/usr/bin/env python3
"""
Career Pakistan — scripts/vercel_homepage_verify.py
Run from project root: python3 scripts/vercel_homepage_verify.py

UPDATES vs original:
  - Domain corrected: careerhub.pk → careerpk.vercel.app
  - CSS assets updated: cms-additions/design-enhancements → main-enhanced.css
  - Grid checks expanded: #scholarshipsGrid + #jobsGrid → all 5 category grids
  - Added: /api/sheets endpoint checks for all 7 sheets
  - Added: dark mode body.dark toggle check via Playwright
  - Added: mobile bottom nav visibility check
  - Results JSON written to qa_verification_results.json
"""
from __future__ import annotations

import json
import subprocess
import sys
import time
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError

# ── Config ─────────────────────────────────────────────────────
PROD_BASE = "https://careerpk.vercel.app"

PROD_URLS = [
    # Pages
    f"{PROD_BASE}/",
    f"{PROD_BASE}/jobs.html",
    f"{PROD_BASE}/scholarships.html",
    f"{PROD_BASE}/internships.html",
    f"{PROD_BASE}/exams.html",
    f"{PROD_BASE}/books.html",
    f"{PROD_BASE}/opportunity.html",
    f"{PROD_BASE}/blog.html",
    # CSS (updated filenames per master prompt Bug #3 merge)
    f"{PROD_BASE}/css/style.css",
    f"{PROD_BASE}/css/main-enhanced.css",
    f"{PROD_BASE}/css/perf-improvements.css",
    # JS
    f"{PROD_BASE}/js/cms-bootstrap.js",
    f"{PROD_BASE}/js/google-sheet-loader.js",
    f"{PROD_BASE}/js/app.js",
    f"{PROD_BASE}/js/opportunity-detail.js",
    # API sheets — all 7 tabs
    f"{PROD_BASE}/api/sheets?sheet=Jobs",
    f"{PROD_BASE}/api/sheets?sheet=Scholarships",
    f"{PROD_BASE}/api/sheets?sheet=Internships",
    f"{PROD_BASE}/api/sheets?sheet=Exams",
    f"{PROD_BASE}/api/sheets?sheet=Books",
    f"{PROD_BASE}/api/sheets?sheet=Blogs",
    f"{PROD_BASE}/api/sheets?sheet=Notifications",
]

# All 5 category grids on the homepage + opportunity page check
HOMEPAGE_GRIDS = [
    "#scholarshipsGrid",
    "#jobsGrid",
    "#internshipsGrid",
    "#examsGrid",
    "#booksGrid",
]

VIEWPORTS = [
    ("desktop", {"width": 1366, "height": 768}),
    ("tablet",  {"width": 820,  "height": 1180}),
    ("mobile",  {"width": 390,  "height": 844}),
]


def head_status(url: str) -> dict:
    """Return HTTP status and content-type for a URL via HEAD request."""
    req = Request(url, method="HEAD")
    try:
        with urlopen(req, timeout=15) as r:
            return {
                "status": r.status,
                "content_type": r.headers.get("Content-Type", ""),
                "cache_control": r.headers.get("Cache-Control", ""),
            }
    except HTTPError as e:
        return {"status": e.code, "error": str(e)}
    except URLError as e:
        return {"status": None, "error": str(e.reason)}
    except Exception as e:
        return {"status": None, "error": str(e)}


def check_production() -> dict:
    """HEAD-check all production URLs and return results."""
    results = {}
    print("\n[1/3] Checking production HTTP status...")
    for url in PROD_URLS:
        info = head_status(url)
        status = info.get("status")
        ok = status is not None and status < 400
        icon = "✅" if ok else "❌"
        # Flag if sheets.js is still returning no-store (Bug #2 not fixed)
        cache = info.get("cache_control", "")
        cache_warn = " ⚠️  Cache-Control still no-store!" if "no-store" in cache and "/api/sheets" in url else ""
        print(f"  {icon} HTTP {status or 'ERR'}  {url}{cache_warn}")
        results[url] = info
    return results


def check_local_playwright(local_port: int = 4173) -> list:
    """
    Spin up a local HTTP server and run Playwright viewport checks.
    Checks:
      - Page loads with HTTP 200
      - All 5 category grids are present and have card children
      - Mobile bottom nav is visible at mobile viewport
      - Dark mode body.dark class is applied correctly
    """
    results = []

    try:
        from playwright.sync_api import sync_playwright  # type: ignore
    except ImportError:
        print("\n  ℹ️  Playwright not installed — skipping local viewport checks.")
        print("     Install with: pip install playwright && playwright install chromium")
        return results

    print(f"\n[2/3] Starting local server on port {local_port}...")
    server = subprocess.Popen(
        ["python3", "-m", "http.server", str(local_port)],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    time.sleep(1.5)

    base_url = f"http://127.0.0.1:{local_port}"

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)

            for vp_name, viewport in VIEWPORTS:
                print(f"\n  Testing viewport: {vp_name} ({viewport['width']}×{viewport['height']})")
                ctx  = browser.new_context(viewport=viewport)
                page = ctx.new_page()

                result: dict = {
                    "viewport":     vp_name,
                    "dimensions":   viewport,
                    "status":       None,
                    "grids":        {},
                    "dark_mode":    None,
                    "bottom_nav":   None,
                    "cms_data_loaded": None,
                }

                try:
                    resp = page.goto(
                        f"{base_url}/index.html",
                        wait_until="networkidle",
                        timeout=90_000,
                    )
                    page.wait_for_timeout(2500)
                    result["status"] = resp.status if resp else None

                    # ── Grid checks ──────────────────────────────────────
                    for grid_id in HOMEPAGE_GRIDS:
                        el = page.query_selector(grid_id)
                        if not el:
                            result["grids"][grid_id] = {"present": False, "card_count": 0}
                            print(f"    ❌ Grid not found: {grid_id}")
                        else:
                            card_count = len(el.query_selector_all(".card, .skeleton-card"))
                            result["grids"][grid_id] = {
                                "present":    True,
                                "card_count": card_count,
                                "class":      page.evaluate("(e)=>e.className", el),
                            }
                            icon = "✅" if card_count > 0 else "⚠️"
                            print(f"    {icon} {grid_id}: {card_count} card(s)")

                    # ── Dark mode toggle check ───────────────────────────
                    # Simulate clicking the theme button
                    theme_btn = page.query_selector("#themeBtn")
                    if theme_btn:
                        theme_btn.click()
                        page.wait_for_timeout(300)
                        has_dark = page.evaluate("()=>document.body.classList.contains('dark')")
                        result["dark_mode"] = has_dark
                        icon = "✅" if has_dark else "❌"
                        print(f"    {icon} Dark mode toggle: body.dark = {has_dark}")
                        # Toggle back
                        theme_btn.click()
                        page.wait_for_timeout(200)
                    else:
                        result["dark_mode"] = "button_not_found"
                        print("    ❌ #themeBtn not found")

                    # ── Mobile bottom nav visibility ─────────────────────
                    if vp_name == "mobile":
                        nav = page.query_selector(".mobile-bottom-nav")
                        if nav:
                            is_visible = nav.is_visible()
                            result["bottom_nav"] = is_visible
                            icon = "✅" if is_visible else "❌"
                            print(f"    {icon} Mobile bottom nav visible: {is_visible}")
                        else:
                            result["bottom_nav"] = False
                            print("    ❌ .mobile-bottom-nav not found")

                    # ── CMS data loaded check ────────────────────────────
                    cms_ready = page.evaluate("()=>!!(window.CMS_DATA && Object.keys(window.CMS_DATA).length)")
                    result["cms_data_loaded"] = cms_ready
                    icon = "✅" if cms_ready else "⚠️"
                    print(f"    {icon} window.CMS_DATA loaded: {cms_ready}")

                except Exception as e:
                    result["error"] = str(e)
                    print(f"    ❌ Error: {e}")
                finally:
                    ctx.close()

                results.append(result)

            browser.close()

    finally:
        server.terminate()

    return results


def check_file_integrity() -> dict:
    """
    Local file checks — verify critical files exist and key fixes are applied.
    """
    print("\n[3/3] Local file integrity checks...")
    root = Path(".")
    checks: dict = {}

    critical_files = [
        "css/style.css",
        "css/main-enhanced.css",      # replaces cms-additions + design-enhancements
        "css/perf-improvements.css",
        "js/cms-bootstrap.js",
        "js/google-sheet-loader.js",
        "js/app.js",
        "js/opportunity-detail.js",
        "api/sheets.js",
        "api/gemini-chat.js",
        "api/web-search.js",
        "api/subscribe.js",
        "api/deadline-alerts.js",
        "api/cms.js",
        "api/chat-feedback.js",
        "manifest.json",
        "vercel.json",
        "robots.txt",
        "sitemap.xml",
        "logo.png",
    ]

    for fname in critical_files:
        exists = (root / fname).exists()
        checks[fname] = {"exists": exists}
        icon = "✅" if exists else "❌"
        print(f"  {icon} {fname}")

    # Check Bug #2 fix in api/sheets.js
    sheets_path = root / "api/sheets.js"
    if sheets_path.exists():
        content = sheets_path.read_text(encoding="utf-8")
        bug2_fixed = "s-maxage=1800" in content
        checks["bug2_cache_fix"] = bug2_fixed
        icon = "✅" if bug2_fixed else "❌"
        print(f"  {icon} Bug #2 fix (s-maxage in api/sheets.js): {bug2_fixed}")

    # Check Bug #7 fix in google-sheet-loader.js
    loader_path = root / "js/google-sheet-loader.js"
    if loader_path.exists():
        content = loader_path.read_text(encoding="utf-8")
        bug7_fixed = "Date.now()" not in content
        checks["bug7_cache_buster_removed"] = bug7_fixed
        icon = "✅" if bug7_fixed else "❌"
        print(f"  {icon} Bug #7 fix (Date.now() removed from loader): {bug7_fixed}")

    # Warn if old merged CSS files still present
    old_css = ["css/cms-additions.css", "css/design-enhancements.css"]
    for f in old_css:
        if (root / f).exists():
            print(f"  ⚠️  Old CSS still present (delete it): {f}")
            checks[f + "_should_be_deleted"] = True

    return checks


def main() -> int:
    print("=" * 54)
    print(" Career Pakistan — Vercel Homepage Verifier")
    print("=" * 54)

    results = {
        "production":      check_production(),
        "local_viewports": check_local_playwright(),
        "file_integrity":  check_file_integrity(),
        "run_at":          __import__("datetime").datetime.utcnow().isoformat() + "Z",
    }

    out_path = Path("qa_verification_results.json")
    out_path.write_text(json.dumps(results, indent=2, default=str), encoding="utf-8")

    print(f"\n✅ Results written to {out_path}")
    print("=" * 54)

    # Exit non-zero if any production URL failed
    prod_failures = [
        url for url, info in results["production"].items()
        if info.get("status") is None or info.get("status", 0) >= 400
    ]
    if prod_failures:
        print(f"\n❌ {len(prod_failures)} production URL(s) failed:")
        for u in prod_failures:
            print(f"   {u}")
        return 1

    print("\n✅ All production checks passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
