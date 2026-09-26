#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/../.."
export PATH="$PWD/.dev/build-tools/node-v22.20.0-linux-x64/bin:$PATH"
export NODE_OPTIONS=--max-old-space-size=8192
export CI=1 EXPO_NO_TELEMETRY=1 CSC_IDENTITY_AUTO_DISCOVERY=false
mkdir -p .dev artifacts
trap 'echo "Build failed. See .dev/build-*.log, .dev/package-macos.log and .dev/sign-macos.log." >&2' ERR
python3 fork/macos/prepare.py
node fork/macos/build-info.cjs > .dev/fork-build-info.json
EXPO_PUBLIC_PASEO_FORK_VERSION="$(node -p 'require("./.dev/fork-build-info.json").displayVersion')"
export EXPO_PUBLIC_PASEO_FORK_VERSION
npm run build:app-deps:clean > .dev/build-app-deps.log 2>&1
(cd packages/app && PASEO_WEB_PLATFORM=electron ../../node_modules/.bin/expo export --platform web --max-workers 4 --clear) > .dev/build-renderer.log 2>&1
{
  npm run build:relay:clean
  npm run build:clean --workspace=@getpaseo/server
  npm run build:clean --workspace=@getpaseo/cli
  npm run build:main --workspace=@getpaseo/desktop
} > .dev/build-desktop-main.log 2>&1
npm run typecheck --workspace=@getpaseo/desktop > .dev/typecheck-desktop.log 2>&1
node packages/cli/dist/index.js --version
(cd packages/desktop && ../../node_modules/.bin/electron-builder --config ../../fork/macos/builder.cjs --mac --arm64 --dir --publish never) > .dev/package-macos.log 2>&1
node fork/macos/verify-asar.cjs
.dev/build-tools/apple-codesign-0.29.0-x86_64-unknown-linux-musl/rcodesign sign \
  --config-file /dev/null --timestamp-url none \
  --entitlements-xml-file packages/desktop/build/entitlements.mac.plist \
  --entitlements-xml-file 'Contents/Frameworks/Paseo Helper.app:packages/desktop/build/entitlements.mac.inherit.plist' \
  --entitlements-xml-file 'Contents/Frameworks/Paseo Helper (Renderer).app:packages/desktop/build/entitlements.mac.inherit.plist' \
  --entitlements-xml-file 'Contents/Frameworks/Paseo Helper (GPU).app:packages/desktop/build/entitlements.mac.inherit.plist' \
  --entitlements-xml-file 'Contents/Frameworks/Paseo Helper (Plugin).app:packages/desktop/build/entitlements.mac.inherit.plist' \
  artifacts/macos-build/mac-arm64/Paseo.app > .dev/sign-macos.log 2>&1
python3 fork/macos/archive.py
