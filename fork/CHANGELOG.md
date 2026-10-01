# Fork changelog

Upstream release notes remain in the upstream changelog. Entries here describe only bs-main-0926.

## 2026-10-01 — Rebase onto 0.11.0-beta.2

- Rebase the fork onto upstream main b5b43edd6 and preserve all nine feature commits from the personal fork.
- Preserve upstream's Appearance settings layout and restore the Custom CSS section at its existing integration site.
- Retain queue status, Trae skill warnings, compact CSS selectors, build identity, resumable directories, named worktrees, and the composer label picker. Preserve exact worktree placement for both branch and branchless recovery. Update the recorded upstream base and version.

Validation: server/CLI builds and 19 focused fork tests passed. Another 101 focused worktree, recovery, project-config, and directory-search tests passed after integrating the personal fork. Workspace typecheck, lint, and formatting passed.

## 2026-09-28 — Rebase onto Paseo 0.10.0-beta.1

- Rebase the nine fork commits from `c081e0350` onto upstream `30178c4f5`.
- Keep upstream's reorganized Appearance settings and insert the Custom CSS section without restoring settings that upstream moved elsewhere.
- Preserve queue status, skill-warning presentation, Custom CSS, fork build identity, named worktrees, resumable directories, and composer label assignment.

Validation: client and server builds, 14 focused fork server tests, 5 focused fork app tests, 52 worktree tests, 33 project-config and directory-search tests, and 36 focused browser E2E scenarios passed. Workspace typecheck, lint, and formatting passed. Packaging verification is recorded per artifact.

## 2026-09-27 — Branch and commit in About (0.9.2 fork)

- Show the build branch and commit in Settings → About and the native macOS About panel, including a dirty marker for uncommitted builds.
- Generate one build-identity record for the renderer, Electron package, ZIP, and verification report. Preserve upstream numeric versions for compatibility and update checks.
- Verify the shipped branch/commit label by parsing JavaScript string literals so minifier escapes preserve their displayed value. Check default yellow warning CSS and retain saved custom styles.
- Document that queue and warning extraction belongs to the daemon. The encrypted relay needs no update for either feature.

Validation: the real-app About test passed with an injected branch/commit label; the connected host retained its ordinary version display. Workspace typecheck, lint, formatting, build-script syntax checks, build-identity generation, and both skill validators passed. Native About-panel appearance requires macOS.

## 2026-09-27 — Yellow skill warnings (0.9.2 fork)

- Recognize Trae's complete skill-description truncation notice from both ACP backends and display it as a warning, separately from the following answer.
- Render warning text in yellow/amber and expose `--paseo-warning-color` through Custom CSS. Preserve saved styles, ordinary assistant text, and info/error colors.
- Keep the recognizer and appearance logic in fork files, using an optional ACP notice parser and notification data attributes as small integration hooks.
- Include the parser in the bundled daemon. Remote daemons need this update; existing transcript text is not rewritten.

Validation: 19 focused server/client/browser tests and both real-app CSS flows passed. Warning delivery, separate assistant messages, default/custom colors, saved CSS without the new variable, reload, reset, narrow layout, compact activity spacing, and Chat outline clearance are covered. Workspace typecheck, lint, formatting, and the rebase skill validator passed.

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
