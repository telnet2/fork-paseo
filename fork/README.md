# Paseo fork: bs-main-0926

This is the canonical design and maintenance entry point for our fork. The base is recorded in [upstream.json](upstream.json); changes are recorded in [CHANGELOG.md](CHANGELOG.md).

## Queue status

Trae sends backend queue progress in ACP `session/update`, under `session_info_update._meta.trae.queueStatus`. The states are queued, waiting, and ready. Compaction uses `operation: context_compaction`; ordinary responses omit operation.

The Trae adapter enables `features.headless_queue_status=true` unless the configured command already contains an explicit override. Trae source and user configuration files are unchanged.

```text
Trae metadata -> provider parser -> internal event -> managed agent state
             -> optional snapshot field -> composer track pill
```

Queue status belongs to the current turn. Ready clears it explicitly with null. Finished, cancelled, failed, closed and replaced turns cannot retain visible queue state. Status is never a task or transcript entry, and stored agent records omit it. Snapshot replay gives reconnecting clients the current authoritative value. ACP does not carry a turn ID in this metadata; the adapter binds it to the currently active local turn, relying on Trae's upstream filtering and ordered delivery.

The chip shares the task pill's popover/sheet component and composer clearance. Position is shown verbatim, including zero; no ETA is inferred.

## Custom CSS

Desktop and browser clients expose **Settings → Appearance → Custom CSS**. The first launch uses the Wide & compact preset: conversation rows and the composer fill the available width, with smaller paragraph and activity gaps. Apply saves to this client's local storage and updates open views immediately. Reset CSS saves an empty stylesheet and restores upstream styles. Native iOS/Android clients do not load custom CSS.

The variables at the top of the editable preset are:

```css
:root {
  --paseo-content-max-width: none;
  --paseo-content-padding: 4px;
  --paseo-paragraph-gap: 4px;
  --paseo-assistant-padding: 2px;
  --paseo-activity-gap: 0px;
  --paseo-activity-line-height: 21px;
  --paseo-warning-color: #f4bf4f;
}
```

Use `1100px` in place of `none` to cap the reading width. Content padding is the inner transcript gutter; Paseo also keeps its responsive outer gutter. Paragraph gap applies to Markdown paragraphs and split streaming blocks. Assistant padding controls the space around text beside reasoning/tool summaries; compact edges between split blocks remain zero. Activity gap controls text/activity boundaries. The preset's selector rules below the variables remove padding and invisible borders inside collapsed activity rows. Keep those rules when editing the variables. Activity line height controls their label and icon slot; 21 px matches the default conversation line height. If you change the content font size, use its line height (content size × 1.4, rounded) here as well. Expanded details retain upstream spacing. The preset also sets transcript left padding to 48 px for Chat outline clearance while retaining the 4 px right inset.

Saved custom CSS is never overwritten on upgrade. Select **Wide & compact**, then **Apply CSS**, to load the revised preset. Changing only `--paseo-activity-gap` affects the space between text and activities; it cannot remove internal row padding.

Ordinary CSS rules are accepted too. The stable selectors are `[data-paseo-content="transcript"]`, `[data-paseo-content="composer"]`, `[data-paseo-content="tracks"]`, `[data-paseo-assistant-spacing]`, `[data-paseo-activity="collapsed"]`, and the activity header/icon/open-file attributes used in the preset. For example:

```css
[data-paseo-assistant-spacing] a {
  text-decoration-thickness: 2px;
}
```

CSS lives under local-storage key `paseo.fork.custom-css.v1`, separately from upstream preferences. Browser tabs on the same origin synchronize it; remote daemons and other devices do not store or receive it. To recover if a rule hides Settings, run `localStorage.setItem("paseo.fork.custom-css.v1", ""); location.reload();` in the client developer console.

The implementation is in `packages/app/src/fork/appearance/`. Upstream hooks mount the provider/editor and mark layout surfaces with stable data attributes; the fork stylesheet owns all overrides. Paseo's configuration and plugin-theme API expose no custom CSS or layout tokens. A daemon wrapper cannot style the Electron renderer. Keep these hooks until upstream provides equivalent client CSS customization, then migrate the stored stylesheet and drop them. Do not override virtualizer positioning or measured heights; width/spacing changes use the existing ResizeObserver measurement path.

## Trae skill warnings

Trae emits the complete “Skill descriptions were shortened…” notice as an ACP assistant text chunk. Its app-server backend prefixes it with `Warning: `; the legacy backend sends the body. Neither supplies a severity field. The fork recognizes the two known bodies (with or without the 2% budget), only on complete chunks without a model message ID, and maps them to Paseo's existing warning notification. Unrecognized text follows the normal assistant path. The warning stays separate from the next answer, and no wire schema changes are needed.

Warning text is yellow/amber by default. Customize it in **Settings → Appearance → Custom CSS**:

```css
:root {
  --paseo-warning-color: #f4bf4f;
}
```

Add the variable to your existing `:root` block to preserve your layout. The color applies to warning text; info/error notices and ordinary assistant text retain their styles. Stable selectors are `[data-paseo-notification="warning"]` and `[data-paseo-notification-text]`. Saved CSS without the variable uses the notification icon's amber; Reset CSS removes the override and keeps that default warning color.

The relay forwards encrypted traffic and does not extract queue or warning metadata. These features need no relay deployment. The connected daemon must run this fork to classify new Trae warnings. Old transcript text is not rewritten. The bundled desktop daemon includes the parser; remote hosts need the updated daemon too. No Trae source changes are required.

The parser lives in `server/agent/providers/fork/trae-skill-warning.ts`. The generic ACP hook is optional and wired through create/resume; providers other than Trae retain their existing behavior. CSS alone cannot recognize unmarked text, and Trae supplies no typed warning extension to configure. Keep the text recognizer until Trae exposes severity metadata, then replace it and retain the same transport/rendering tests.

## Ownership and integration sites

| Concern                                         | Owner                                             |
| ----------------------------------------------- | ------------------------------------------------- |
| Authentication, routing, retries, backend queue | Existing Trae process                             |
| Skill-warning recognition                       | server agent/providers/fork/trae-skill-warning.ts |
| Metadata validation and launch opt-in           | server agent/providers/fork/trae-queue-status.ts  |
| State transitions and deduplication             | server agent/fork/queue-status.ts                 |
| Wire schema                                     | protocol/src/fork/queue-status.ts                 |
| Subscription, labels and chip                   | app/src/fork/                                     |
| Client CSS persistence, editor and rules        | app/src/fork/appearance/                          |
| Build environment and package verification      | fork/macos/                                       |

The existing files contain only integration hooks: ACP parser option plumbing (create/resume), Trae adapter configuration, internal event union, manager event dispatch/state normalization, snapshot schema/projection, app snapshot mappings, and track visibility/rendering. Generated validators remain ignored outputs.

A separate npm workspace would require extra exports, dependency/lockfile updates and packaging integration. Dedicated files inside existing packages keep package ownership intact and reduce that rebase surface.

Configuration alone cannot solve the dropped metadata. A client plugin can draw pills but does not receive standard ACP session-info metadata. A custom connector plus plugin could work, but would add a second state transport and session-lifecycle integration. The user explicitly chose a source fork; the generic parser hook and optional snapshot field keep that change small. Drop these hooks when upstream offers equivalent behavior, retaining the same contract tests.

Binding boundaries: preserve upstream authentication, retries, user-message queuing, task semantics and public stream-event discriminants. Keep wire additions optional. Do not restart the main daemon to test.

## Verification

From the repository root with Node 22 on PATH:

```sh
npm run build:client
npm run test:unit --workspace=@getpaseo/server -- src/server/agent/providers/fork/trae-queue-status.test.ts src/server/agent/providers/fork/trae-skill-warning.test.ts src/server/agent/fork/queue-status.test.ts --maxWorkers=1 --bail=1
npm run test --workspace=@getpaseo/app -- src/fork/queue-snapshots.test.ts src/fork/queue-status-pill.browser.test.tsx --bail=1
npm run typecheck
npm run lint
```

The server test uses real ACP SDK serialization and AgentManager snapshots with deterministic queue notifications. It covers explicit clearing, snapshot replay, persistence exclusion, unrelated sessions, completion, cancellation, failure, closure and consecutive turns. The focused state test covers duplicate and stale-turn events. Client tests cover snapshot round-tripping and explicit or old-daemon clears. The browser test exercises the real chip and expandable message. On first run, Vite may optimize dependencies and reload the browser; rerun the same focused command after optimization finishes.

For CSS changes, run the focused browser failure/retry test and real-app layout test:

```sh
npm run test --workspace=@getpaseo/app -- src/fork/appearance/section.browser.test.tsx --bail=1
npm run test:e2e --workspace=@getpaseo/app -- e2e/browser/fork-custom-css.spec.ts e2e/browser/fork-warning-css.spec.ts --workers=1
```

The layout test uses an isolated daemon and deterministic provider. It checks saved CSS after reload, actual transcript/composer geometry, narrow viewports, collapsed activity height and adjacent row spacing against paragraph line height, hover/expansion, and reset; screenshots record original, wide and narrow layouts.

The warning browser test uses a deterministic ACP process through the real Trae provider registration and isolated daemon. It verifies both backend forms, normal answer text, saved CSS without the new variable, a custom color, reload, reset, and narrow layout.

Build with `bash fork/macos/build.sh`. Dependencies and tools stay in ignored node_modules/.dev; ZIPs and reports stay in ignored artifacts. Existing prepared-checkout scripts under .dev are superseded by this tracked workflow.

## Build identity

The macOS build captures its package version, actual Git branch, full commit, nine-character commit, and dirty state in `.dev/fork-build-info.json`. Settings → About shows `v0.9.2 · bs-main-0926 · <commit>`, and the native Paseo → About Paseo panel shows the same branch/commit as its build label. Uncommitted builds include `dirty`; detached checkouts use `detached` as the branch.

The fork build passes the display value to Expo through `EXPO_PUBLIC_PASEO_FORK_VERSION` and includes the same record in the Electron package metadata and `BUILD-INFO.json` inside the ZIP. The package verifier requires the renderer and native metadata to match. Archive names and verification reports use the captured branch and commit; archiving fails if HEAD or the clean/dirty state changed during the build. The renderer cache is cleared so a previous commit label cannot leak into a new build.

This is a display label. Package versions, macOS bundle versions, daemon compatibility comparisons, and update checks retain the upstream numeric version. Builds outside this fork workflow show the ordinary version unless the display environment variable is supplied. The warning color `#f4bf4f` remains in the default Wide & compact stylesheet; saved CSS is preserved.

For the version display, run `EXPO_PUBLIC_PASEO_FORK_VERSION='0.9.2 · bs-main-0926 · e2e-build' npm run test:e2e --workspace=@getpaseo/app -- e2e/browser/fork-build-version.spec.ts --workers=1`. The actual commit is checked again in the packaged renderer and metadata during the macOS build. Native About-panel appearance still needs a Mac check.

## Rebase, rollout and rollback

Use [paseo-fork-rebase](../.agents/skills/paseo-fork-rebase/SKILL.md) and [paseo-build-macos](../.agents/skills/paseo-build-macos/SKILL.md). Test upgrades against the same source/wire fixtures and preserve small fork commits.

The packaged local daemon includes the queue adapter. Remote hosts need the forked daemon as well. The archive retains Paseo's app identity and local settings paths; quit the existing app before replacing it. Builds have ad-hoc signatures and no Apple notarization. The package has no upstream update feed; install future fork archives manually.

Roll back by reinstalling the previous archive. No queue-state migration is needed. An explicit `-c features.headless_queue_status=false` on a provider command disables queue emission.

## Material decisions

| Date       | Decision                                                                                                       |
| ---------- | -------------------------------------------------------------------------------------------------------------- |
| 2026-09-27 | Create bs-main-0926 from c081e0350; use isolated source files and small core hooks, as requested.              |
| 2026-09-27 | Transport transient queue status through existing snapshots, with no new public event kind or persisted state. |
| 2026-09-27 | Add local client CSS with stable layout anchors and a Wide & compact default preset.                           |
| 2026-09-27 | Track macOS cross-build tooling as upstream-derived configuration and verified native archives.                |

The earlier investigation in artifacts/trae-queue-status-design.md is archived and non-normative. This document owns the implemented design.
