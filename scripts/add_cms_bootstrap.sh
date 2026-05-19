#!/usr/bin/env bash
# ============================================================
# Career Pakistan — add_cms_bootstrap.sh  (v2)
# Run from project root: bash add_cms_bootstrap.sh
#
# WHAT IT DOES:
#   1. Adds js/cms-bootstrap.js to every HTML page's <head>
#      (synchronous, no defer — must be the FIRST script tag)
#   2. Replaces old CSS links with the updated filenames:
#      - css/cms-additions.css      → css/main-enhanced.css
#      - css/design-enhancements.css → (removed, merged into main-enhanced)
#   3. Adds css/main-enhanced.css link if missing
#   4. Reports a clear summary of what changed
#
# Safe to re-run — checks before modifying each file.
# ============================================================
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
CHANGED=0; SKIPPED=0

ok()   { echo -e "${GREEN}✅  $*${NC}"; }
info() { echo -e "${CYAN}ℹ️   $*${NC}"; }
warn() { echo -e "${YELLOW}⚠️   $*${NC}"; }
done_file() { CHANGED=$((CHANGED+1)); }
skip_file() { SKIPPED=$((SKIPPED+1)); }

HTML_PAGES=(
    index.html
    scholarships.html
    scholarships-national.html
    scholarships-international.html
    jobs.html
    jobs-government.html
    jobs-private.html
    internships.html
    exams.html
    exams-css.html
    exams-mdcat.html
    exams-ppsc.html
    books.html
    blog.html
    blog-post.html
    opportunity.html
    search.html
    favorites.html
    contact.html
    about.html
    privacy.html
    terms.html
    resume-builder.html
)

echo ""
echo "==========================================="
echo " Career Pakistan — Bootstrap & CSS Patcher"
echo "==========================================="
echo ""

for f in "${HTML_PAGES[@]}"; do
    if [ ! -f "$f" ]; then
        warn "Not found (skip): $f"
        skip_file
        continue
    fi

    FILE_CHANGED=0

    # ── Step A: Add cms-bootstrap.js if missing ─────────────────
    if grep -q "cms-bootstrap" "$f"; then
        : # already present
    else
        # Insert before the first existing <script> tag if possible
        if grep -q '<script src="js/seo.js"' "$f"; then
            sed -i 's|<script src="js/seo.js"|<script src="js/cms-bootstrap.js"></script>\n  <script src="js/seo.js"|' "$f"
        elif grep -q '<script src="js/google-sheet-loader.js"' "$f"; then
            sed -i 's|<script src="js/google-sheet-loader.js"|<script src="js/cms-bootstrap.js"></script>\n<script src="js/google-sheet-loader.js"|' "$f"
        elif grep -q '<script' "$f"; then
            # Fallback: insert before first <script> tag
            sed -i 's|<script|<script src="js/cms-bootstrap.js"></script>\n  <script|' "$f"
        else
            # Last resort: before </head>
            sed -i 's|</head>|  <script src="js/cms-bootstrap.js"></script>\n</head>|' "$f"
        fi
        echo "  + cms-bootstrap.js added to $f"
        FILE_CHANGED=1
    fi

    # ── Step B: Replace css/cms-additions.css → css/main-enhanced.css ──
    if grep -q 'css/cms-additions.css' "$f"; then
        sed -i 's|css/cms-additions\.css|css/main-enhanced.css|g' "$f"
        echo "  ~ css link updated (cms-additions → main-enhanced) in $f"
        FILE_CHANGED=1
    fi

    # ── Step C: Remove css/design-enhancements.css line (merged into main-enhanced) ──
    if grep -q 'css/design-enhancements.css' "$f"; then
        # Remove the entire <link> line for design-enhancements.css
        sed -i '/css\/design-enhancements\.css/d' "$f"
        echo "  - css/design-enhancements.css link removed from $f (merged)"
        FILE_CHANGED=1
    fi

    # ── Step D: Add main-enhanced.css if no cms link was replaced ──
    # (i.e., it wasn't already there and we didn't just add it via step B)
    if ! grep -q 'css/main-enhanced.css' "$f"; then
        # Insert after style.css link
        if grep -q 'css/style.css' "$f"; then
            sed -i 's|css/style\.css"|css/style.css"/>\n  <link rel="stylesheet" href="css/main-enhanced.css"/>|' "$f"
            # Clean up any double .css"/> that might appear
            sed -i 's|css/style\.css"/>/>|css/style.css"/>|g' "$f"
            echo "  + css/main-enhanced.css link added to $f"
            FILE_CHANGED=1
        fi
    fi

    if [ "$FILE_CHANGED" -eq 1 ]; then
        ok "$f — updated"
        done_file
    else
        info "$f — no changes needed"
        skip_file
    fi
done

# ── Also add defer to google-sheet-loader.js and app.js if missing ──
echo ""
echo "--- Checking defer attributes on script tags ---"
for f in "${HTML_PAGES[@]}"; do
    [ -f "$f" ] || continue
    # google-sheet-loader and app.js should have defer (not cms-bootstrap which must be sync)
    for script in "google-sheet-loader.js" "app.js" "seo.js" "comprehensive-fix.js" \
                  "cms-auto-refresh-listener.js" "deadline-badges.js" "opportunity-detail.js" \
                  "opportunity-enhancements.js" "resume.js"; do
        if grep -q "src=\"js/${script}\"" "$f" && ! grep -q "src=\"js/${script}\" defer\|defer src=\"js/${script}\"" "$f"; then
            sed -i "s|src=\"js/${script}\"|src=\"js/${script}\" defer|g" "$f"
            echo "  + defer added to js/${script} in $f"
        fi
    done
done

# ── Summary ────────────────────────────────────────────────────
echo ""
echo "==========================================="
echo -e " Done.  ${GREEN}${CHANGED} file(s) updated${NC}  |  ${CYAN}${SKIPPED} skipped${NC}"
echo "==========================================="
echo ""
echo "Next: Run bash scripts/web-smoke-check.sh to verify all changes."
echo ""
