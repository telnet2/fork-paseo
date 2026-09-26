---
name: paseo-build-macos
description: Prepare the Paseo fork's Linux x64 build environment and create a verified Apple Silicon macOS ZIP with its daemon and CLI, ad-hoc signatures, provenance, and checksums.
---

# Build Paseo for Apple Silicon

Work from the repository root. Read `AGENTS.md` and `fork/README.md`. This workflow cross-builds on Linux x64 for macOS 13+ arm64. It does not notarize or publish.

## Prepare

Use Python 3.11+, Git, npm through the pinned Node 22 toolchain, and the public network route approved for this host. On the current host, wrap downloads with the use-system-proxy skill's `with-system-proxy.sh`; do not record proxy values.

Run `python3 fork/macos/prepare.py --install` on a fresh checkout. It verifies tool archives against `fork/macos/toolchain.json`, installs from package-lock.json, then restores the three Darwin optional packages that Linux npm ci omits. Omit `--install` for an already installed checkout.

Export the pinned Node directory before npm checks:

```sh
export PATH="$PWD/.dev/build-tools/node-v22.20.0-linux-x64/bin:$PATH"
```

Never run npm ci after restoring Darwin packages without running prepare.py again. Do not regenerate the lockfile to install foreign-platform packages.

When dependencies change, check that the package-lock paths in prepare.py still identify the server's esbuild and the required native modules. When Electron changes, update its toolchain manifest URL and checksum from the official release SHA256 manifest. Verify official Node and apple-codesign release checksums when updating those tools. Do not accept a new checksum merely because a download produced it.

## Validate and package

1. Run the focused queue and CSS tests listed in `fork/README.md`, workspace typecheck, and lint. Rebuild dependent workspace declarations before diagnosing stale types. Install headless Chromium with the repository's Playwright version when needed.
2. Record branch, HEAD, and working-tree state. Prefer a clean committed tree so the artifact maps to an exact revision. Keep prior ZIPs.
3. Run `bash fork/macos/build.sh`. It generates `.dev/fork-build-info.json` from the current branch/commit and embeds the display label in the renderer and Electron metadata. Do not edit the generated record or override package versions to show fork identity. It rebuilds renderer, daemon, CLI and Electron main; derives builder configuration from upstream; packages arm64; verifies the ASAR and required native dependencies; signs ad-hoc; verifies Mach-O code pages and bundle resources; creates a ZIP preserving symlinks and permissions.
4. Inspect `artifacts/Paseo-*-bs-main-0926-*-macos-arm64.zip.verification.json` and its SHA-256 sidecar. A failed verifier is a failed build. Check that the displayed version and `BUILD-INFO.json` identify the same source revision as the archive. Report the archive path, size, checksum, source revision, and minimum macOS.
5. On a Mac, extract and copy Paseo.app to Applications. Run `codesign --verify --deep --strict --verbose=2 /Applications/Paseo.app`, then launch and connect a Trae provider to verify the chip. Check both Settings → About and Paseo → About Paseo for the branch/commit label. Check Appearance → Custom CSS, save/reload/reset, and transcript scrolling at wide and narrow window sizes. Keep this marked untested until performed on macOS.

Inspect `.dev/build-*.log`, `.dev/package-macos.log`, and `.dev/sign-macos.log` on failure. The rcodesign verifier rejects empty CMS data on ad-hoc signatures; use the included CodeDirectory verifier on Linux and Apple's codesign on macOS. Do not describe the Linux checks as Apple trust or Gatekeeper validation.

Deliver the ZIP with `fork/macos/INSTALL-MACOS.txt` and the fork changelog (included by the archive script). A remote daemon must run this fork too; installing only the desktop UI cannot make an older daemon forward queue metadata.
