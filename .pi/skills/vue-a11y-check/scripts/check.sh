#!/usr/bin/env bash
# Vue SFC Accessibility Checker
# Scans a .vue file for common WCAG 2.1 AA violations
# Usage: ./check.sh <path/to/Component.vue>

set -euo pipefail

RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

FILE="$1"

if [[ ! -f "$FILE" ]]; then
    echo "Error: File not found: $FILE"
    exit 1
fi

echo ""
echo "============================================"
echo "  Vue A11y Check: $FILE"
echo "============================================"
echo ""

# Merge template, script, and style into one content for analysis
# We analyze the <template> and <script> sections
TEMPLATE=$(sed -n '/<template>/,/<\/template>/p' "$FILE")
SCRIPT=$(sed -n '/<script>/,/<\/script>/p' "$FILE")
FULL="$TEMPLATE $SCRIPT"

errors=0
warnings=0
infos=0

check_error() {
    echo -e "  ${RED}[ERROR]${NC}   $1"
    ((errors++)) || true
}

check_warning() {
    echo -e "  ${YELLOW}[WARNING]${NC} $1"
    ((warnings++)) || true
}

check_info() {
    echo -e "  ${BLUE}[INFO]${NC}    $1"
    ((infos++)) || true
}

# ─── 1. MISSING ALT TEXT ON IMAGES ───
if echo "$TEMPLATE" | grep -Pq '<img[^>]*>'; then
    img_count=$(echo "$TEMPLATE" | grep -Poc '<img[^>]*>')
    img_alt=$(echo "$TEMPLATE" | grep -Poc '<img[^>]*\balt=')

    if [[ $img_count -gt 0 && $img_alt -lt $img_count ]]; then
        check_error "$img_count <img> tag(s) found but only $img_alt have alt attribute. Every <img> must have alt (use alt=\"\" for decorative images)."
    elif [[ $img_count -gt 0 ]]; then
        check_info "$img_count <img> tag(s) with alt attribute — verify alt text is meaningful."
    fi
fi

# ─── 2. BUTTONS WITHOUT ACCESSIBLE NAMES ───
button_count=$(echo "$TEMPLATE" | grep -Poc '<button\b' || true)
if [[ $button_count -gt 0 ]]; then
    buttons_with_label=$(echo "$TEMPLATE" | tr '\n' ' ' | grep -Poc '<button\b[^>]*\b(aria-label|aria-labelledby|title)=' || true)
    # Approximate check: buttons with no aria-label/labelledby/title rely on text content
    if [[ $buttons_with_label -lt $button_count ]]; then
        check_info "$button_count button(s) found; $buttons_with_label have explicit aria-label/title. The remaining rely on visible text — verify it's meaningful."
    else
        check_info "$button_count button(s) all have explicit accessible names."
    fi
fi

# ─── 3. INPUTS WITHOUT LABELS ───
# Count only visible inputs (exclude type=hidden)
visible_inputs=$(echo "$TEMPLATE" | grep -Poc '<(input|select|textarea)\b' || true)
hidden_inputs=$(echo "$TEMPLATE" | grep -Poc '<input\b[^>]*type="hidden"' || true)
input_count=$((visible_inputs - hidden_inputs))

if [[ $visible_inputs -gt 0 ]]; then
    labelled_input=$(echo "$TEMPLATE" | tr '\n' ' ' | grep -Poc '<(input|select|textarea)\b[^>]*\b(aria-label|aria-labelledby)=' || true)
    label_for=$(echo "$TEMPLATE" | grep -Poc '<label\b[^>]*\bfor=' || true)

    if [[ $input_count -gt 0 ]]; then
        if [[ $labelled_input -gt 0 || $label_for -gt 0 ]]; then
            check_info "$input_count visible input/select/textarea found; $labelled_input have aria-label/labelledby, $label_for label-for associations found."
        else
            check_error "$input_count visible input/select/textarea found with no accessible label. Add <label>, aria-label, or aria-labelledby."
        fi
    fi
fi

# ─── 4. MISSING FOCUS STYLES ───
# Extract <style> block too, and check ALL content
STYLE=$(sed -n '/<style/,/<\/style>/p' "$FILE" 2>/dev/null || true)
ALL="$FULL $STYLE"

if echo "$ALL" | grep -Pq ':focus-visible'; then
    check_info "Uses :focus-visible — good practice for keyboard focus indicators."
else
    if echo "$ALL" | grep -Pq ':focus\b'; then
        check_warning "Uses :focus (not :focus-visible). Prefer :focus-visible to avoid showing focus rings on mouse clicks."
    else
        if echo "$TEMPLATE" | grep -Pq '<(button|a|input|select|textarea)'; then
            check_warning "Interactive elements found but no :focus or :focus-visible styles detected. Ensure visible focus indicators exist."
        fi
    fi
fi

# ─── 5. COLOR CONTRAST CONCERNS ───
# Check for low-contrast patterns: light gray text, #ccc borders on white, etc.
if echo "$FULL" | grep -Piq '#(ccc|ddd|eee|f0f0f0|f5f5f5|f8f8f8|e9ecef|dee2e6|adb5bd)'; then
    check_warning "Light colors detected (e.g., #ccc, #e9ecef, #adb5bd). Verify text/UI contrast meets 4.5:1 / 3:1 ratio against backgrounds."
fi
if echo "$FULL" | grep -Piq 'color:\s*#(999|aaa|bbb|ccc|ddd|eee)'; then
    check_error "Very light text color detected. Likely fails 4.5:1 contrast ratio. Use darker colors or increase font size to qualify as large text."
fi

# ─── 6. KEYBOARD EVENT HANDLERS ───
# Custom div/span click handlers without key handlers
div_click=$(echo "$TEMPLATE" | grep -Poc '<div[^>]*@click=' || true)
div_keydown=$(echo "$TEMPLATE" | grep -Poc '<div[^>]*@keydown=' || true)
span_click=$(echo "$TEMPLATE" | grep -Poc '<span[^>]*@click=' || true)
span_keydown=$(echo "$TEMPLATE" | grep -Poc '<span[^>]*@keydown=' || true)

if [[ $div_click -gt 0 ]]; then
    check_warning "$div_click <div @click> found but only $div_keydown @keydown handlers. Non-interactive elements with click handlers need keyboard support (Enter/Space) or use <button> instead."
fi
if [[ $span_click -gt 0 ]]; then
    check_warning "$span_click <span @click> found but only $span_keydown @keydown handlers. Non-interactive elements with click handlers need keyboard support or use <button> instead."
fi

# ─── 7. MISSING ROLE ON CUSTOM WIDGETS ───
# Check for range inputs (sliders)
range_count=$(echo "$TEMPLATE" | grep -Poc '<input\b[^>]*type="range"' || true)
if [[ $range_count -gt 0 ]]; then
    # Use -z to match multiline, look for aria-label within the input tag
    range_with_label=$(echo "$TEMPLATE" | tr '\n' ' ' | grep -Poc '<input\b[^>]*type="range"[^>]*aria-label=' || true)
    if [[ $range_with_label -lt $range_count ]]; then
        check_error "$range_count range input(s) found but only $range_with_label have aria-label. Every slider/range input needs an accessible name."
    else
        check_info "$range_count range input(s) with aria-label."
    fi
fi

# Check for custom menus
if echo "$TEMPLATE" | grep -Pq 'role="menu"'; then
    menu_items=$(echo "$TEMPLATE" | grep -Poc 'role="menuitem"' || true)
    if [[ $menu_items -eq 0 ]]; then
        check_error "role=\"menu\" found but no role=\"menuitem\" children detected."
    else
        check_info "Menu with $menu_items menuitem(s). Verify aria-haspopup/aria-expanded on trigger and arrow key navigation."
    fi
fi

# ─── 8. MISSING LANG ATTRIBUTE ───
if echo "$TEMPLATE" | head -5 | grep -Pq '<html\b'; then
    if ! echo "$TEMPLATE" | head -5 | grep -Pq 'lang='; then
        check_error "<html> tag has no lang attribute. Add lang=\"en\" (or appropriate language code)."
    fi
fi

# ─── 9. DYNAMIC CONTENT WITHOUT ARIA-LIVE ───
if echo "$TEMPLATE" | grep -Pq '\bv-(if|show|for)\b'; then
    if ! echo "$TEMPLATE" | grep -Pq '\baria-live='; then
        check_warning "Dynamic content (v-if/v-show/v-for) detected without aria-live. Screen reader users may miss content changes."
    fi
fi

# Check for error displays without role=alert (only if classes contain error/alert)
if echo "$TEMPLATE" | grep -Piq 'class="[^"]*(error|alert|warning)[^"]*"'; then
    if ! echo "$TEMPLATE" | grep -Pq 'role="alert"'; then
        check_warning 'Error/alert class found without role="alert" or aria-live="assertive". Errors should be announced to screen readers.'
    fi
fi

# ─── 10. MISSING HEADING HIERARCHY ───
h_tags=$(echo "$TEMPLATE" | grep -Po '<h[1-6]\b' | sort -u || true)
if [[ -n "$h_tags" ]]; then
    h_nums=$(echo "$h_tags" | grep -Po '[1-6]' | sort -n)
    first=$(echo "$h_nums" | head -1)

    # Check if first heading is h1 (for top-level)
    if [[ "$first" != "1" ]]; then
        check_info "First heading is <h${first}>. Ensure heading hierarchy is logical (no skipped levels) and starts appropriately for the component context."
    fi

    # Check for skipped levels
    prev=0
    while IFS= read -r num; do
        if [[ $prev -gt 0 && $num -gt $((prev + 1)) ]]; then
            check_warning "Heading level jump from h${prev} to h${num}. Do not skip heading levels."
        fi
        prev=$num
    done <<< "$h_nums"
fi

# ─── 11. MISSING VIDEO ACCESSIBILITY ───
if echo "$TEMPLATE" | grep -Pq '<video\b'; then
    if ! echo "$TEMPLATE" | grep -Pq '<track\b'; then
        check_error "<video> element found without <track> for captions. Add at minimum a captions track."
    fi
    video_with_controls=$(echo "$TEMPLATE" | grep -Poc '<video[^>]*\bcontrols' || true)
    if [[ $video_with_controls -eq 0 ]]; then
        check_warning "<video> has no controls attribute. Users must be able to control playback via keyboard."
    fi
fi

# ─── 12. MATERIAL ICONS WITHOUT TEXT ALTERNATIVE ───
if echo "$TEMPLATE" | grep -Pq 'material-symbols'; then
    icon_spans=$(echo "$TEMPLATE" | grep -Poc '<span[^>]*class="[^"]*material-symbols[^"]*"[^>]*>' || true)
    if [[ $icon_spans -gt 0 ]]; then
        check_warning "$icon_spans material-symbols icon(s) found. Icons inside buttons need aria-hidden=\"true\" (or equivalent) on the icon span + accessible name on the parent button."
    fi
fi

# ─── 13. NON-SEMANTIC INTERACTIVE ELEMENTS ───
div_role_button=$(echo "$TEMPLATE" | grep -Poc '<div\b[^>]*role="button"' || true)
if [[ $div_role_button -gt 0 ]]; then
    check_warning "$div_role_button <div role=\"button\"> found. Prefer native <button> elements. If using div, ensure it has tabindex=\"0\", keyboard handler, and accessible name."
fi

# ─── 14. MISSING SKIP LINK ───
# Only relevant for full-page components
if echo "$TEMPLATE" | grep -Piq '(header|navbar|navigation)'; then
    if ! echo "$TEMPLATE" | grep -Pq 'skip.*(nav|content|main)' || true; then
        check_info "Navigation elements detected. Consider a skip-to-content link if this is a full page template."
    fi
fi

# ─── 15. I18N / $t() COVERAGE ───
text_content=$(echo "$TEMPLATE" | grep -Po '>\s*[A-Z][a-z]{2,}[^<]*<' | grep -Pv '^\s*$' || true)
if [[ -n "$text_content" ]]; then
    # Only warn if there's hardcoded English text not wrapped in $t()
    hardcoded_count=$(echo "$TEXT" | grep -Pc '>\s*[A-Z][a-z]{2,}[^<]*<' || true)
    t_count=$(echo "$TEMPLATE" | grep -Poc '\$t\(' || true)
    if [[ $hardcoded_count -gt 2 && $t_count -lt 3 ]]; then
        check_info "Hardcoded English text detected with few \$t() calls. Consider internationalizing all user-facing strings."
    fi
fi

# ─── 16. aria-hidden on interactive parents ───
if echo "$TEMPLATE" | grep -Pq '\baria-hidden="true"'; then
    # Check if aria-hidden contains focusable descendants
    if echo "$TEMPLATE" | grep -Pqz '(?s)aria-hidden="true"[^>]*>.*?<(button|a|input|select|textarea)' 2>/dev/null || true; then
        check_error "aria-hidden=\"true\" parent contains focusable children. Elements with aria-hidden=\"true\" must not contain focusable descendants."
    fi
fi

# ─── 17. MISSING aria-expanded ON COLLAPSIBLE TRIGGERS ───
# Look for buttons that toggle menus/menus without aria-expanded
if echo "$TEMPLATE" | grep -Pq '(toggle|open|show|expand)'; then
    if ! echo "$TEMPLATE" | grep -Pq 'aria-expanded='; then
        check_info "Toggle-like behavior detected. Add aria-expanded to communicate state to screen readers."
    fi
fi

# ─── Summary ───
echo ""
echo "────────────────────────────────────────────"
echo "  Summary: ${RED}$errors errors${NC}, ${YELLOW}$warnings warnings${NC}, ${BLUE}$infos info${NC}"
echo "────────────────────────────────────────────"

if [[ $errors -gt 0 ]]; then
    echo "  🔴 Fix errors before release."
elif [[ $warnings -gt 0 ]]; then
    echo "  🟡 Review warnings and address where applicable."
else
    echo "  🟢 No automated issues detected. Perform manual WCAG review."
fi

echo ""
echo "  Next: Review manually using the WCAG checklist at"
echo "  references/wcag-checklist.md in this skill directory."
echo ""