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

## Ownership and integration sites

| Concern                                         | Owner                                            |
| ----------------------------------------------- | ------------------------------------------------ |
| Authentication, routing, retries, backend queue | Existing Trae process                            |
| Metadata validation and launch opt-in           | server agent/providers/fork/trae-queue-status.ts |
| State transitions and deduplication             | server agent/fork/queue-status.ts                |
| Wire schema                                     | protocol/src/fork/queue-status.ts                |
| Subscription, labels and chip                   | app/src/fork/                                    |
| Build environment and package verification      | fork/macos/                                      |

The existing files contain only integration hooks: ACP parser option plumbing (create/resume), Trae adapter configuration, internal event union, manager event dispatch/state normalization, snapshot schema/projection, app snapshot mappings, and track visibility/rendering. Generated validators remain ignored outputs.

A separate npm workspace would require extra exports, dependency/lockfile updates and packaging integration. Dedicated files inside existing packages keep package ownership intact and reduce that rebase surface.

Configuration alone cannot solve the dropped metadata. A client plugin can draw pills but does not receive standard ACP session-info metadata. A custom connector plus plugin could work, but would add a second state transport and session-lifecycle integration. The user explicitly chose a source fork; the generic parser hook and optional snapshot field keep that change small. Drop these hooks when upstream offers equivalent behavior, retaining the same contract tests.

Binding boundaries: preserve upstream authentication, retries, user-message queuing, task semantics and public stream-event discriminants. Keep wire additions optional. Do not restart the main daemon to test.

## Verification

From the repository root with Node 22 on PATH:

```sh
npm run build:client
npm run test:unit --workspace=@getpaseo/server -- src/server/agent/providers/fork/trae-queue-status.test.ts src/server/agent/fork/queue-status.test.ts --maxWorkers=1 --bail=1
npm run test --workspace=@getpaseo/app -- src/fork/queue-snapshots.test.ts src/fork/queue-status-pill.browser.test.tsx --bail=1
npm run typecheck
npm run lint
```

The server test uses real ACP SDK serialization and AgentManager snapshots with deterministic queue notifications. It covers explicit clearing, snapshot replay, persistence exclusion, unrelated sessions, completion, cancellation, failure, closure and consecutive turns. The focused state test covers duplicate and stale-turn events. Client tests cover snapshot round-tripping and explicit or old-daemon clears. The browser test exercises the real chip and expandable message. On first run, Vite may optimize dependencies and reload the browser; rerun the same focused command after optimization finishes.

Build with `bash fork/macos/build.sh`. Dependencies and tools stay in ignored node_modules/.dev; ZIPs and reports stay in ignored artifacts. Existing prepared-checkout scripts under .dev are superseded by this tracked workflow.

## Rebase, rollout and rollback

Use [paseo-fork-rebase](../.agents/skills/paseo-fork-rebase/SKILL.md) and [paseo-build-macos](../.agents/skills/paseo-build-macos/SKILL.md). Test upgrades against the same source/wire fixtures and preserve small fork commits.

The packaged local daemon includes the queue adapter. Remote hosts need the forked daemon as well. The archive retains Paseo's app identity and local settings paths; quit the existing app before replacing it. Builds have ad-hoc signatures and no Apple notarization. The package has no upstream update feed; install future fork archives manually.

Roll back by reinstalling the previous archive. No queue-state migration is needed. An explicit `-c features.headless_queue_status=false` on a provider command disables queue emission.

## Material decisions

| Date       | Decision                                                                                                       |
| ---------- | -------------------------------------------------------------------------------------------------------------- |
| 2026-09-27 | Create bs-main-0926 from c081e0350; use isolated source files and small core hooks, as requested.              |
| 2026-09-27 | Transport transient queue status through existing snapshots, with no new public event kind or persisted state. |
| 2026-09-27 | Track macOS cross-build tooling as upstream-derived configuration and verified native archives.                |

The earlier investigation in artifacts/trae-queue-status-design.md is archived and non-normative. This document owns the implemented design.
