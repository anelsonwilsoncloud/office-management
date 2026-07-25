#!/usr/bin/env bash
# Builds a self-contained native app package for Office Management.
# End users do NOT need Java or Docker — the JRE is bundled inside.
#
# Usage:
#   ./build-installer.sh [version] [type]
#
#   version  App version stamped into the package  (default: 1.0.0)
#   type     jpackage output type                  (default: app-image)
#              app-image  self-contained folder; zip and share (no extra tools)
#              deb        Debian/Ubuntu package      (requires fakeroot)
#              rpm        Red Hat/Fedora package     (requires rpm-build)
#              pkg        macOS .pkg installer
#              dmg        macOS disk image
#
# Examples:
#   ./build-installer.sh
#   ./build-installer.sh 2.0.0 dmg

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VERSION="${1:-1.0.0}"
TYPE="${2:-app-image}"

step() { printf '\n\033[0;36m==> %s\033[0m\n' "$*"; }

# ── 1. Build Angular ──────────────────────────────────────────────────────────
step "Building Angular frontend..."
(cd "$ROOT/frontend" && npm ci --silent && npm run build)

# ── 2. Copy dist into Spring Boot static resources ───────────────────────────
step "Copying Angular dist to backend static resources..."
STATIC_DIR="$ROOT/backend/src/main/resources/static"
rm -rf "$STATIC_DIR"
mkdir -p "$STATIC_DIR"
cp -r "$ROOT/frontend/dist/frontend/browser/." "$STATIC_DIR/"

# ── 3. Build Spring Boot JAR ──────────────────────────────────────────────────
step "Building Spring Boot JAR..."
(cd "$ROOT/backend" && mvn -q -DskipTests package)

# ── 4. Package with jpackage ──────────────────────────────────────────────────
step "Packaging with jpackage (type: $TYPE)..."
OUTPUT_DIR="$ROOT/installer"
rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR"

ICON_ARGS=()
ICON_PATH="$ROOT/frontend/public/favicon.ico"
if [[ -f "$ICON_PATH" ]]; then
    ICON_ARGS=(--icon "$ICON_PATH")
fi

jpackage \
    --input       "$ROOT/backend/target" \
    --name        "Office Management" \
    --main-jar    "office-management.jar" \
    --type        "$TYPE" \
    --app-version "$VERSION" \
    --description "Personal office activity, todos and bookmarks tracker" \
    --dest        "$OUTPUT_DIR" \
    "${ICON_ARGS[@]}"

printf '\n\033[0;32mDone! Output: %s\033[0m\n' "$OUTPUT_DIR"

if [[ "$TYPE" == "app-image" ]]; then
    printf '\nNext steps for distribution:\n'
    printf '  1. Zip the "Office Management" folder inside %s\n' "$OUTPUT_DIR"
    printf '  2. Send the zip to the end user\n'
    printf '  3. They extract and run the "Office Management" binary\n'
    printf '     - Browser opens automatically at http://localhost:8080\n'
    printf '     - System-tray icon lets them re-open or quit the app\n'
    printf '     - Data is saved to ~/.office-management/office.db\n'
fi
