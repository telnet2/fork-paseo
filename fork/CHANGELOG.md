# Fork changelog

Upstream release notes remain in the upstream changelog. Entries here describe only bs-main-0926.

## 2026-09-27 — Queue status (0.9.2 fork)

- Show Trae backend queue progress above the composer, beside task pills.
- Display queue position when provided, distinguish context compaction, and expand the pill to read the backend message.
- Enable Trae's existing headless queue reporting unless the provider command explicitly overrides it.
- Synchronize transient queue status through agent snapshots; clear it on ready and turn termination without writing it to agent storage or transcript history.
- Translate queue labels with Paseo’s language setting using a separate fork resource file.
- Keep fork behavior in dedicated files with small provider, snapshot, and UI hooks.
- Add repository skills for rebasing and producing Apple Silicon builds.
- Track the Linux-to-macOS build workflow, native dependency restoration, ad-hoc signing, archive verification, and source/checksum reports.

Base: c081e0350d15c10d0897610ce7a9e14727e7d408, Paseo 0.9.2. Apple Silicon builds require macOS 13 or newer. They are ad-hoc signed and not Apple-notarized; macOS launch validation requires a Mac.

Validation: 12 focused server/client/browser tests passed; workspace typecheck, lint, formatting, and both skill validators passed. Packaging verification is recorded per artifact in its verification JSON.
