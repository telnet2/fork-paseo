---
name: paseo-fork-rebase
description: Rebase the bs-main-0926 Paseo fork onto getpaseo/paseo main, resolve conflicts while preserving isolated fork behavior, and validate the queue-status integration.
---

# Rebase the Paseo fork

Work from the repository root. Read `AGENTS.md`, `fork/README.md`, and `fork/CHANGELOG.md`. Use `fork/upstream.json` as the recorded base. Keep all fork behavior in the existing `fork/` source directories and the small integration sites listed in the design.

1. Check `git status --short --branch`, `git remote -v`, and `git log --oneline --decorate -12`. Preserve user work. Do not silently stash or reset it.
2. Verify which remote points to `getpaseo/paseo`; do not assume a future fork's origin is upstream. Fetch that remote's main branch using the host's approved network/proxy route.
3. Record old HEAD and old base. Create a uniquely named local backup branch at old HEAD. Rebase on an isolated worktree/temporary branch if the fork worktree is dirty or in active use.
4. Rebase the fork commits onto the fetched main revision. Resolve by keeping upstream behavior and reapplying the narrow fork hooks. Never select ours/theirs for an entire shared file. Treat generated protocol validators and dist files as outputs: regenerate, do not hand-merge.
5. Review `git range-diff <old-base>..<old-head> <new-base>..HEAD` and the shared-file diff. Remove fork hooks when upstream supplies equivalent tested behavior. Preserve the ACP session-info parser on both create and resume paths, explicit-null queue clearing, turn identity, non-persistence, and queue-only composer clearance. Preserve the CSS provider/editor hooks and stable transcript, composer, tracks, paragraph, and assistant-spacing data attributes. Check `streamRowDataSet` against upstream gap semantics after rebasing.
6. Update `fork/upstream.json` to the new base and append the material result to the fork changelog. Keep upstream's changelog and package versions unchanged.
7. Rebuild declarations with `npm run build:client` and `npm run build:server`. Run the exact focused tests in `fork/README.md`, then `npm run typecheck` and `npm run lint`. Format through npm scripts. Never run the full test suite or restart the main daemon on port 6767.
8. Use `$paseo-build-macos` to rebuild and validate a new archive. Keep the prior archive until the replacement is verified. Report old/new bases, fork HEAD, conflicts, tests, and artifact checksum.

After verifying the remote and creating the backup, the rebase command is:

```sh
git rebase --onto <fetched-main-revision> <recorded-old-base> bs-main-0926
```

Substitute the verified commit IDs; do not copy placeholders literally.

Do not push or rewrite a published branch unless the user has authorized it. When authorized, use an explicit expected remote revision with force-with-lease. To abandon a rebase in progress use `git rebase --abort`; retain the backup branch for recovery.

Keep the source diff small. The optional queue snapshot is a protocol addition; new fields stay optional, and internal queue events must not escape into the public stream-event union.
