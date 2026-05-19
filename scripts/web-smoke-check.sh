#!/usr/bin/env bash
# ============================================================
# Career Pakistan — scripts/web-smoke-check.sh
# Run from project root: bash scripts/web-smoke-check.sh
#
# UPDATES vs original:
#   - Domain corrected: careerhub.pk → careerpk.vercel.app
#   - CSS check updated: cms-additions/design-enhancements →
#     main-enhanced.css (Bug #3 merge from master prompt)
#   - Added: api/ JS syntax check
#   - Added: check for cms-bootstrap.js on all HTML pages
#   - Added: dark mode token presence check in style.css
#   - Added: color report for pass/fail output
# ============================================================
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
PASS=0; FAIL=0

ok()   { echo -e "${GREEN}✅ $*${NC}"; PASS=$((PASS+1)); }
fail() { echo -e "${RED}❌ $*${NC}"; FAIL=$((FAIL+1)); }
info() { echo -e "${YELLOW}ℹ️  $*${NC}"; }

echo ""
echo "================================================"
echo " Career Pakistan — Web Smoke Check"
echo "================================================"
echo ""

# ── [1/5] Local asset / page link resolution ──────────────────
echo "[1/5] Checking local asset and page links in HTML files..."

python3 - <<'PY'
from pathlib import Path
from html.parser import HTMLParser
import sys

class RefParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.refs = []
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        attr = {"link": "href", "script": "src", "img": "src", "a": "href"}.get(tag)
        if attr and attrs.get(attr):
            self.refs.append((tag, attrs[attr]))

root = Path(".")
html_files = sorted(root.glob("*.html"))
missing = []

SKIP_PREFIXES = ("http://", "https://", "mailto:", "tel:", "#", "javascript:", "/_vercel/")

for html_file in html_files:
    # Skip known debug/test pages
    if html_file.name in ("menu-test.html", "exams-css.html"):
        continue
    parser = RefParser()
    try:
        parser.feed(html_file.read_text(encoding="utf-8", errors="ignore"))
    except Exception:
        continue
    for tag, value in parser.refs:
        if any(value.startswith(p) for p in SKIP_PREFIXES):
            continue
        target = value.split("?")[0].split("#")[0]
        if not target:
            continue
        target_path = (root / target.lstrip("/")) if target.startswith("/") else (html_file.parent / target)
        if not target_path.exists():
            missing.append((html_file.name, tag, target))

if missing:
    print("FAIL: Missing local links/assets:")
    for f, t, v in missing:
        print(f"  file={f}  tag=<{t}>  target={v}")
    sys.exit(1)

print(f"PASS: Checked {len(html_files)} HTML pages — all local links/assets resolve.")
PY
ok "HTML link resolution"

# ── [2/5] JavaScript syntax check (js/ + api/) ───────────────
echo ""
echo "[2/5] Checking JavaScript syntax (js/ and api/)..."

JS_ERRORS=0
for dir in js api; do
    if [ ! -d "$dir" ]; then
        continue
    fi
    for file in "$dir"/*.js; do
        [ -e "$file" ] || continue
        if ! node --check "$file" >/dev/null 2>&1; then
            echo -e "${RED}  ❌ Syntax error: $file${NC}"
            node --check "$file" 2>&1 | head -5
            JS_ERRORS=$((JS_ERRORS+1))
        fi
    done
done

if [ "$JS_ERRORS" -eq 0 ]; then
    ok "JavaScript syntax — all js/ and api/ files pass"
else
    fail "JavaScript syntax — $JS_ERRORS file(s) failed"
fi

# ── [3/5] JSON config validation ──────────────────────────────
echo ""
echo "[3/5] Validating JSON config files..."

python3 - <<'PY'
import json, sys
from pathlib import Path

configs = ["manifest.json", "vercel.json"]
errors = []
for name in configs:
    p = Path(name)
    if not p.exists():
        errors.append(f"{name}: file not found")
        continue
    try:
        data = json.loads(p.read_text(encoding="utf-8"))
        print(f"  OK: {name}")
    except json.JSONDecodeError as e:
        errors.append(f"{name}: {e}")

if errors:
    for e in errors:
        print(f"FAIL: {e}")
    sys.exit(1)

print("PASS: All JSON configs are valid.")
PY
ok "JSON config validation"

# ── [4/5] Critical file checks ────────────────────────────────
echo ""
echo "[4/5] Checking critical files exist and have correct content..."

# Check updated CSS file exists (main-enhanced replaces cms-additions + design-enhancements)
CRITICAL_CSS=(
    "css/style.css"
    "css/main-enhanced.css"
    "css/perf-improvements.css"
)
for f in "${CRITICAL_CSS[@]}"; do
    if [ -f "$f" ]; then
        ok "CSS exists: $f"
    else
        fail "CSS missing: $f"
    fi
done

# Warn if old merged files still present
OLD_CSS=("css/cms-additions.css" "css/design-enhancements.css")
for f in "${OLD_CSS[@]}"; do
    if [ -f "$f" ]; then
        fail "Old CSS still present (should be deleted): $f"
    fi
done

# Check critical JS files
CRITICAL_JS=(
    "js/cms-bootstrap.js"
    "js/google-sheet-loader.js"
    "js/app.js"
    "js/seo.js"
    "js/opportunity-detail.js"
)
for f in "${CRITICAL_JS[@]}"; do
    if [ -f "$f" ]; then
        ok "JS exists: $f"
    else
        fail "JS missing: $f"
    fi
done

# Check all HTML pages have cms-bootstrap.js loaded (Bug #4 guard)
echo ""
info "Checking cms-bootstrap.js is loaded on all HTML pages..."
PAGES=(
    index.html scholarships.html jobs.html internships.html exams.html
    books.html blog.html blog-post.html opportunity.html search.html
    favorites.html contact.html about.html privacy.html terms.html
    resume-builder.html
)
MISSING_BOOTSTRAP=0
for page in "${PAGES[@]}"; do
    if [ ! -f "$page" ]; then
        info "Page not found (skip): $page"
        continue
    fi
    if ! grep -q "cms-bootstrap" "$page"; then
        fail "cms-bootstrap.js missing from: $page"
        MISSING_BOOTSTRAP=$((MISSING_BOOTSTRAP+1))
    fi
done
if [ "$MISSING_BOOTSTRAP" -eq 0 ]; then
    ok "cms-bootstrap.js present on all checked pages"
fi

# Check Bug #2 fix applied in api/sheets.js
if [ -f "api/sheets.js" ]; then
    if grep -q "s-maxage=1800" "api/sheets.js"; then
        ok "api/sheets.js cache header is correct (s-maxage=1800)"
    else
        fail "api/sheets.js still has old no-store cache header (Bug #2 not fixed)"
    fi
else
    fail "api/sheets.js not found"
fi

# Check Bug #7 fix: no Date.now() cache-buster in google-sheet-loader.js
if [ -f "js/google-sheet-loader.js" ]; then
    if grep -q "Date.now()" "js/google-sheet-loader.js"; then
        fail "js/google-sheet-loader.js still has Date.now() cache-buster (Bug #7 not fixed)"
    else
        ok "js/google-sheet-loader.js — Date.now() cache-buster removed"
    fi
fi

# Check dark mode tokens in style.css
if [ -f "css/style.css" ]; then
    if grep -q "body.dark" "css/style.css" && grep -q "\-\-primary" "css/style.css"; then
        ok "css/style.css — dark mode tokens present"
    else
        fail "css/style.css — missing dark mode token block"
    fi
fi

# ── [5/5] Production HTTP status checks ───────────────────────
echo ""
echo "[5/5] Checking production HTTP status for key URLs..."

PROD_BASE="https://careerpk.vercel.app"
CHECK_URLS=(
    "$PROD_BASE/"
    "$PROD_BASE/css/style.css"
    "$PROD_BASE/css/main-enhanced.css"
    "$PROD_BASE/css/perf-improvements.css"
    "$PROD_BASE/js/cms-bootstrap.js"
    "$PROD_BASE/js/app.js"
    "$PROD_BASE/api/sheets?sheet=Jobs"
    "$PROD_BASE/api/sheets?sheet=Scholarships"
)

python3 - <<PY
import sys
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError

urls = """${CHECK_URLS[*]}""".split()
errors = []

for url in urls:
    req = Request(url, method="HEAD")
    try:
        with urlopen(req, timeout=12) as r:
            status = r.status
            if status < 400:
                print(f"  HTTP {status}  {url}")
            else:
                print(f"  HTTP {status} ❌  {url}")
                errors.append(url)
    except HTTPError as e:
        print(f"  HTTP {e.code} ❌  {url}")
        errors.append(url)
    except URLError as e:
        print(f"  ERROR: {e.reason}  {url}")
        errors.append(url)

if errors:
    sys.exit(1)
PY

if [ $? -eq 0 ]; then
    ok "All production URLs returned HTTP 2xx"
else
    fail "One or more production URLs failed"
fi

# ── Summary ────────────────────────────────────────────────────
echo ""
echo "================================================"
echo -e " Results: ${GREEN}${PASS} passed${NC}  ${RED}${FAIL} failed${NC}"
echo "================================================"
echo ""

if [ "$FAIL" -gt 0 ]; then
    exit 1
fi
exit 0
