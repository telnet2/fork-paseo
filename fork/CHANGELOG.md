# Fork changelog

Upstream release notes remain in the upstream changelog. Entries here describe only bs-main-0926.

## 2026-09-27 — Compact activity rows (0.9.2 fork)

- Update Wide & compact to use 4 px paragraph gaps, 2 px assistant padding, zero text/activity gap, and 48 px transcript left padding for Chat outline clearance.
- Make collapsed reasoning and tool summary rows 21 px high, matching the default paragraph line height, by removing internal vertical padding and transparent borders.
- Expose activity line height in the preset and stable header/icon selectors; preserve expanded detail spacing and hover behavior.
- Preserve saved CSS on upgrade. Select Wide & compact and Apply CSS to adopt the revised preset.

Validation: 13 focused fork tests and the real-app CSS test passed. Collapsed activity height and adjacent row spacing both match the 21 px paragraph line height; Chat outline clearance, hover, expansion/collapse, persistence, reset, and wide/narrow layouts passed. Workspace typecheck, lint, and the rebase skill validator passed.

## 2026-09-27 — Custom CSS (0.9.2 fork)

- Add Settings → Appearance → Custom CSS for desktop and browser clients, with Apply, Wide & compact, and Reset CSS controls.
- Use a wider, tighter default preset: remove the 820 px content cap, align the composer and tracks, and reduce paragraph, assistant, and activity spacing.
- Expose CSS variables and stable transcript/composer selectors for further customization without rebuilding.
- Save styles locally, synchronize browser tabs, preserve drafts on save failure, and restore original styles on reset.
- Keep CSS logic in separate fork files with small registration and data-attribute hooks. Native clients retain their existing styles.

Validation: 13 focused fork tests and the real-app CSS test passed, including reasoning/tool spacing, reload persistence, reset, and 1600/390 px layouts. Workspace typecheck, lint, formatting, and both skill validators passed.

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
