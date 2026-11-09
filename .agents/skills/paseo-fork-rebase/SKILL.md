---
name: paseo-fork-rebase
description: Roll the Paseo customization from a previous bs-main-MMDD branch into a new dated branch on the latest getpaseo/paseo main, preserve fork behavior, validate, push to the personal GitHub fork, and retain at most two historical fork branches.
---

# Rebase the Paseo fork

Read `AGENTS.md`, `fork/README.md`, and `fork/CHANGELOG.md`. The selected previous branch's `fork/upstream.json` records its upstream base. Keep fork behavior in the existing `fork/` directories and narrow integration hooks.

## Roll to a new dated branch

1. Inspect status, worktrees, local branches, and remotes. Verify the upstream URL is `getpaseo/paseo` and the push remote is the user's fork. Preserve user work; do not silently stash or reset it.
2. Use the previous branch named by the user, or review the newest customized `bs-main-MMDD` branch. Use the requested new name; otherwise use today's `MMDD`. Never overwrite an existing dated branch.
3. Fetch upstream `main` and the personal fork using the host's network/proxy route. Inspect the refreshed local and fork-remote refs for a destination-name collision or divergent previous branch before creating the new branch. Pull upstream `main` with `--ff-only` in an unused clean `main` checkout. If another session uses that checkout, first add a detached temporary worktree at the fetched upstream ref and pull there; never pull while on the previous fork branch. Record the pulled revision, previous fork HEAD, and base read from that previous branch. Verify the recorded base is its ancestor.
4. Create the new branch from the previous fork. The previous branch is the recovery point and stays unchanged. Use a temporary worktree when the main checkout is dirty or used by other sessions; do not add another backup branch.
5. Rebase the new branch's custom commits onto the recorded pulled main revision. Resolve shared files by keeping current upstream behavior and reapplying the narrow fork hooks. Regenerate validators and declarations; do not hand-merge generated outputs. Keep upstream package versions.

After resolving the names and revisions:

```sh
git switch -c "$new_branch" "$previous_branch"
git rebase --onto "$new_base" "$old_base"
```

Run these in an unused, clean checkout. For a new temporary worktree, use `git worktree add -b "$new_branch" "$temporary_path" "$previous_branch"`, then run the rebase there. If the detached temporary worktree from the pull step already exists, run `git switch -c "$new_branch" "$previous_branch"` there instead. To abandon a rebase, use `git rebase --abort` in that worktree.

## Preserve the customization

Review `git range-diff "$old_base..$old_head" "$new_base..HEAD"` and every shared-file change. Drop a hook only when upstream supplies equivalent tested behavior.

- Preserve ACP session-info and notification parsers on create and resume, explicit-null queue clearing, turn identity, non-persistence, and composer queue display. Keep skill-warning matching limited to complete known notices without model message IDs and reset the assistant-message boundary after a notice.
- Preserve the Custom CSS provider/editor and stable transcript, composer, activity, assistant-spacing, and warning attributes. Adapt paragraph styling to the current Markdown renderer without restoring an old rendering pipeline. Compact selectors must leave expanded activity details usable and respect upstream indentation gaps.
- Preserve the About label in the app and native macOS panel. Numeric package versions still drive compatibility and update checks.
- Preserve resumable directories, manual branch names, project-root placement, and composer label assignment. Keep upstream plugin lifecycle hooks, asynchronous config/metadata ownership, verified worktree ownership, and exact recovery paths. Keep form choices in the current setup model.
- Read the protocol and routing docs before changing those boundaries. Optional wire additions remain optional.

Update `fork/upstream.json` with the new upstream commit, version, and fork branch. Add the dated result to `fork/CHANGELOG.md` and correct obsolete conventions in `fork/README.md`.

## Validate and publish

Select the Node version pinned by the rebased `.tool-versions`. Install dependencies in a fresh worktree with `npm ci --registry=https://registry.npmjs.org --no-audit --no-fund` through the required network route, or reuse a verified copy whose lockfile matches. Build declarations with `npm run build:server`; it includes the client/protocol stack. Run the focused fork and workspace tests listed in `fork/README.md`, then `npm run typecheck`, `npm run lint`, and `npm run format`. Inspect the formatter's diff before committing and recheck affected code when it changes. Never run the full test suite or restart the daemon on port 6767. Build platform archives only when requested; use `$paseo-build-macos` for a macOS archive.

When the user authorizes pushing, publish the new branch with `git push -u "$fork_remote" "$new_branch"`. Verify the remote ref equals local HEAD. A new dated branch uses an ordinary push; rewriting an existing published branch requires authorization and an explicit expected-revision force-with-lease.

## Retain two historical branches

After the new branch is pushed and verified, keep it plus at most two historical `bs-main-[0-9][0-9][0-9][0-9]` branches. Apply the cap to both local branches and the personal fork's branches. Count the active branch separately. If fewer than two historical branches exist, retain those present.

Rank historical branches by commit date, not by the four-digit suffix, which wraps at New Year. Review the local and fetched fork-remote branch tips before selecting the newest two. If a name has divergent local and remote tips, resolve which tip contains the required customization before pruning; do not rank that pair by timestamp alone. Delete older dated refs only after confirming the new branch contains their required customizations or the user authorized stale-branch deletion. Refuse to remove a checked-out branch or a worktree with uncommitted files. If a protected worktree prevents the cap, retain it and report the unresolved retention count. Delete a fork-remote ref with an explicit expected-tip lease, and verify the resulting remote branch set. Never delete upstream branches, unrelated branches, or create extra backup refs that evade the cap.

Remove a clean temporary worktree after publication, retaining its branch. Report the new branch/link, upstream base, preserved changes, validation, and active/historical branches. Leave the previous branch unchanged.
