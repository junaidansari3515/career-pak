#!/usr/bin/env bash
# ============================================================
# Career Pakistan — fix_file_swaps.sh  (v2)
# Run from project root: bash fix_file_swaps.sh
#
# The original script targeted HTML file swaps from a previous
# scan. This version targets the ACTUAL file swap bugs found
# in the current codebase deep scan (May 2026):
#
# CONFIRMED SWAPS IN api/ FOLDER:
#   api/web-search.js      contained → subscribe.js code
#   api/subscribe.js       contained → sheets.js code (wrong header)
#   api/deadline-alerts.js contained → cms.js code
#   api/cms.js             contained → chat-feedback.js code
#
# This script verifies each api/ file contains the correct
# code by checking for a unique identifier string, then
# reports which ones still need the updated file dropped in.
#
# IT DOES NOT overwrite files automatically — it tells you
# exactly which files need replacing so you don't lose work.
# To apply: copy the files from your outputs/careerpk-api/
# folder into api/ manually or use the cp commands printed below.
# ============================================================
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
ERRORS=0; OK=0

ok()   { echo -e "${GREEN}✅  $*${NC}"; OK=$((OK+1)); }
fail() { echo -e "${RED}❌  $*${NC}"; ERRORS=$((ERRORS+1)); }
info() { echo -e "${CYAN}ℹ️   $*${NC}"; }
warn() { echo -e "${YELLOW}⚠️   $*${NC}"; }

echo ""
echo "==========================================="
echo " Career Pakistan — File Swap Checker v2"
echo "==========================================="
echo ""

# ── Check function ─────────────────────────────────────────────
# Usage: check_file <path> <unique_string_that_must_be_present> <description>
check_file() {
    local filepath="$1"
    local marker="$2"
    local description="$3"

    if [ ! -f "$filepath" ]; then
        fail "$filepath — FILE MISSING"
        return
    fi

    if grep -q "$marker" "$filepath" 2>/dev/null; then
        ok "$filepath — correct ($description)"
    else
        fail "$filepath — WRONG CONTENT (still has swapped code)"
        echo -e "     ${YELLOW}Fix: cp outputs/careerpk-api/$(basename $filepath) $filepath${NC}"
    fi
}

echo "--- Checking api/ folder for file swap bugs ---"
echo ""

# Each marker is a unique string ONLY present in the correct file
check_file "api/sheets.js"         "s-maxage=1800"           "Google Sheets CSV proxy"
check_file "api/gemini-chat.js"    "callGemini"              "Gemini AI chat proxy"
check_file "api/web-search.js"     "GOOGLE_SEARCH_API_KEY"   "Web search for chatbot"
check_file "api/subscribe.js"      "buildWelcomeHtml"        "Email subscription handler"
check_file "api/chat-feedback.js"  "ALLOWED_RATINGS"         "Chatbot feedback logger"
check_file "api/deadline-alerts.js" "findClosingItems"       "Deadline email alerts"
check_file "api/cms.js"            "VALID_TABS"              "All-sheets CMS aggregator"

echo ""
echo "--- Checking js/ folder for known issues ---"
echo ""

# Bug #7: google-sheet-loader.js must NOT contain Date.now()
if [ -f "js/google-sheet-loader.js" ]; then
    if grep -q "Date\.now()" "js/google-sheet-loader.js"; then
        fail "js/google-sheet-loader.js — Date.now() cache-buster present (Bug #7 not fixed)"
        echo -e "     ${YELLOW}Fix: cp outputs/careerpk-js/google-sheet-loader.js js/google-sheet-loader.js${NC}"
    else
        ok "js/google-sheet-loader.js — Date.now() cache-buster removed"
    fi
fi

# Bug #4: cms-bootstrap.js must contain dark mode early injection
if [ -f "js/cms-bootstrap.js" ]; then
    if grep -q "ch_dark" "js/cms-bootstrap.js"; then
        ok "js/cms-bootstrap.js — dark mode early injection present"
    else
        fail "js/cms-bootstrap.js — dark mode fix missing (Bug #4)"
        echo -e "     ${YELLOW}Fix: cp outputs/careerpk-js/cms-bootstrap.js js/cms-bootstrap.js${NC}"
    fi
fi

# Bug #5: opportunity-detail.js must be the real detail page (not menu test)
if [ -f "js/opportunity-detail.js" ]; then
    if grep -q "findItem\|opportunity-detail" "js/opportunity-detail.js"; then
        ok "js/opportunity-detail.js — real detail page renderer"
    else
        fail "js/opportunity-detail.js — still contains menu test code (Bug #5)"
        echo -e "     ${YELLOW}Fix: cp outputs/careerpk-js/opportunity-detail.js js/opportunity-detail.js${NC}"
    fi
fi

echo ""
echo "--- Checking css/ folder for merge status ---"
echo ""

# Bug #3: cms-additions + design-enhancements should be replaced by main-enhanced.css
if [ -f "css/main-enhanced.css" ]; then
    ok "css/main-enhanced.css — merged CSS file present"
else
    fail "css/main-enhanced.css — missing! (Bug #3 not applied)"
    echo -e "     ${YELLOW}Fix: cp outputs/careerpk-css/main-enhanced.css css/main-enhanced.css${NC}"
fi

for old_file in "css/cms-additions.css" "css/design-enhancements.css"; do
    if [ -f "$old_file" ]; then
        warn "$old_file — old file still present, safe to delete"
        echo -e "     ${YELLOW}Fix: rm $old_file${NC}"
    else
        ok "$old_file — correctly removed"
    fi
done

echo ""
echo "--- Checking HTML pages for critical script tags ---"
echo ""

# Spot-check a few key pages for cms-bootstrap.js
KEY_PAGES=("index.html" "jobs.html" "scholarships.html" "opportunity.html" "exams.html")
MISSING_BOOTSTRAP=0
for page in "${KEY_PAGES[@]}"; do
    if [ ! -f "$page" ]; then
        warn "$page not found"
        continue
    fi
    if grep -q "cms-bootstrap" "$page"; then
        ok "$page — cms-bootstrap.js present"
    else
        fail "$page — cms-bootstrap.js MISSING (run add_cms_bootstrap.sh)"
        MISSING_BOOTSTRAP=$((MISSING_BOOTSTRAP+1))
    fi
done

if [ "$MISSING_BOOTSTRAP" -gt 0 ]; then
    echo ""
    echo -e "${YELLOW}  Run: bash add_cms_bootstrap.sh  to fix all pages at once${NC}"
fi

# ── Summary ────────────────────────────────────────────────────
echo ""
echo "==========================================="
echo -e " Results: ${GREEN}${OK} passed${NC}  |  ${RED}${ERRORS} failed${NC}"
echo "==========================================="
echo ""

if [ "$ERRORS" -gt 0 ]; then
    echo -e "${RED}Some files still have issues. See the fix commands above.${NC}"
    echo ""
    echo "Quick fix — copy all updated API files at once:"
    echo "  cp outputs/careerpk-api/*.js api/"
    echo ""
    echo "Quick fix — copy all updated JS files at once:"
    echo "  cp outputs/careerpk-js/*.js js/"
    echo ""
    exit 1
fi

echo -e "${GREEN}All file swap checks passed. Codebase is clean.${NC}"
echo ""
echo "Next step: bash scripts/web-smoke-check.sh"
echo ""
exit 0
