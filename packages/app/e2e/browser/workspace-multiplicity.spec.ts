import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { rm } from "node:fs/promises";

import { test, expect, type Page } from "../support/fixtures";
import { gotoAppShell } from "../support/helpers/app";
import { gotoWorkspace } from "../support/helpers/launcher";
import {
  assertNewWorkspaceSidebarAndHeader,
  connectNewWorkspaceDaemonClient,
  openGlobalNewWorkspaceComposer,
  selectNewWorkspaceProject,
  selectWorkspaceIsolation,
  submitNewWorkspaceEmpty,
} from "../support/helpers/new-workspace";
import { seedWorkspace, type SeededWorkspace } from "../support/helpers/seed-client";
import { expectExplorerEntryVisible } from "../support/helpers/file-explorer";
import { getServerId } from "../support/helpers/server-id";
import { openFilesPanel } from "../support/helpers/workspace-tabs";
import { projectEquivalenceViewKey } from "../support/helpers/project-view-key";
import { waitForSidebarHydration } from "../support/helpers/workspace-ui";
import { createTempGitRepo } from "../support/helpers/workspace";

// Model B reshape: a workspace is the unit, its isolation (local checkout or
// worktree) is a CHOICE at creation, and creation NEVER dedupes by
// directory. These specs drive the real creation UI (workspace-create-* test
// IDs) to prove a single directory can back any number of workspaces.

function workspaceRowTestId(workspaceId: string): string {
  return `sidebar-workspace-row-${getServerId()}:${workspaceId}`;
}

async function openFilesTab(page: Page): Promise<void> {
  await openFilesPanel(page);
  await expect(page.getByTestId("file-explorer-tree-scroll")).toBeVisible({ timeout: 30_000 });
}

async function createWorkspaceViaUi(
  page: Page,
  input: {
    project: { projectKey: string; projectDisplayName: string };
    // null when the project has no git checkout: there is no Isolation control to
    // touch, the isolation is implicitly local.
    isolation: "local" | "worktree" | null;
    branchName?: string;
    previousWorkspaceId: string;
    client: Awaited<ReturnType<typeof connectNewWorkspaceDaemonClient>>;
  },
): Promise<{ workspaceId: string; workspaceName: string; workspaceDirectory: string }> {
  await openGlobalNewWorkspaceComposer(page);
  await selectNewWorkspaceProject(page, input.project);
  if (input.isolation !== null) {
    await selectWorkspaceIsolation(page, input.isolation);
  }
  if (input.branchName) {
    await page.getByTestId("new-workspace-branch-name-input").fill(input.branchName);
  }
  await submitNewWorkspaceEmpty(page);

  return assertNewWorkspaceSidebarAndHeader(page, {
    serverId: getServerId(),
    client: input.client,
    previousWorkspaceId: input.previousWorkspaceId,
    projectDisplayName: input.project.projectDisplayName,
    assertSidebarRow: false,
    assertHeader: false,
  });
}

test.describe("Workspace multiplicity creation flow", () => {
  let client: Awaited<ReturnType<typeof connectNewWorkspaceDaemonClient>>;

  test.describe.configure({ timeout: 240_000 });

  test.beforeEach(async () => {
    client = await connectNewWorkspaceDaemonClient();
  });

  test.afterEach(async () => {
    await client?.close().catch(() => undefined);
  });

  test("two Local workspaces share one git checkout and both are independently selectable", async ({
    page,
  }) => {
    const seeded: SeededWorkspace = await seedWorkspace({
      repoPrefix: "multiplicity-local-git-",
    });

    try {
      const project = {
        projectKey: seeded.projectKey,
        projectDisplayName: seeded.projectDisplayName,
      };

      await gotoAppShell(page);
      await waitForSidebarHydration(page);
      await expect(page.getByTestId(workspaceRowTestId(seeded.workspaceId))).toBeVisible({
        timeout: 30_000,
      });

      const second = await createWorkspaceViaUi(page, {
        project,
        isolation: "local",
        previousWorkspaceId: seeded.workspaceId,
        client,
      });

      // A second workspace was minted on the SAME checkout — creation did not
      // dedupe the directory away.
      expect(second.workspaceId).not.toBe(seeded.workspaceId);
      expect(second.workspaceDirectory).toBe(seeded.workspaceDirectory);

      // Both rows live under the same project and are distinct.
      const firstRow = page.getByTestId(workspaceRowTestId(seeded.workspaceId));
      const secondRow = page.getByTestId(workspaceRowTestId(second.workspaceId));
      await expect(firstRow).toBeVisible({ timeout: 30_000 });
      await expect(secondRow).toBeVisible({ timeout: 30_000 });
      await expect(secondRow).toContainText(second.workspaceName);

      // Selecting the second workspace shows the shared checkout's files.
      await gotoWorkspace(page, second.workspaceId);
      await openFilesTab(page);
      await expectExplorerEntryVisible(page, "README.md");

      // Selecting the first workspace shows the SAME shared directory data.
      await gotoWorkspace(page, seeded.workspaceId);
      await openFilesTab(page);
      await expectExplorerEntryVisible(page, "README.md");
    } finally {
      await seeded.cleanup();
    }
  });

  test("New worktree isolation creates a worktree-backed workspace in a distinct directory", async ({
    page,
  }) => {
    const seeded: SeededWorkspace = await seedWorkspace({
      repoPrefix: "multiplicity-worktree-",
    });

    try {
      const project = {
        projectKey: seeded.projectKey,
        projectDisplayName: seeded.projectDisplayName,
      };

      await gotoAppShell(page);
      await waitForSidebarHydration(page);
      await expect(page.getByTestId(workspaceRowTestId(seeded.workspaceId))).toBeVisible({
        timeout: 30_000,
      });

      const worktree = await createWorkspaceViaUi(page, {
        project,
        isolation: "worktree",
        previousWorkspaceId: seeded.workspaceId,
        client,
      });

      // The worktree row appears, pointing at a directory distinct from the
      // local checkout.
      const worktreeRow = page.getByTestId(workspaceRowTestId(worktree.workspaceId));
      await expect(worktreeRow).toBeVisible({ timeout: 30_000 });
      expect(worktree.workspaceId).not.toBe(seeded.workspaceId);
      expect(worktree.workspaceDirectory).not.toBe(seeded.workspaceDirectory);

      // The daemon descriptor confirms the worktree kind (○ row).
      const descriptor = (await client.fetchWorkspaces()).entries.find(
        (entry) => entry.id === worktree.workspaceId,
      );
      expect(descriptor?.workspaceKind).toBe("worktree");

      await client
        .archivePaseoWorktree({ worktreePath: worktree.workspaceDirectory })
        .catch(() => undefined);
    } finally {
      await seeded.cleanup();
    }
  });

  test("New worktree accepts an explicit branch name", async ({ page }) => {
    const seeded: SeededWorkspace = await seedWorkspace({
      repoPrefix: "multiplicity-manual-branch-",
    });

    try {
      const branchName = "feat/manual-worktree";
      await gotoAppShell(page);
      await waitForSidebarHydration(page);
      await expect(page.getByTestId(workspaceRowTestId(seeded.workspaceId))).toBeVisible({
        timeout: 30_000,
      });

      const worktree = await createWorkspaceViaUi(page, {
        project: {
          projectKey: seeded.projectKey,
          projectDisplayName: seeded.projectDisplayName,
        },
        isolation: "worktree",
        branchName,
        previousWorkspaceId: seeded.workspaceId,
        client,
      });

      expect(
        execFileSync("git", ["branch", "--show-current"], {
          cwd: worktree.workspaceDirectory,
          encoding: "utf8",
        }).trim(),
      ).toBe(branchName);

      await client
        .archivePaseoWorktree({ worktreePath: worktree.workspaceDirectory })
        .catch(() => undefined);
    } finally {
      await seeded.cleanup();
    }
  });

  test("Resume workspace opens an external git worktree without taking ownership", async ({
    page,
  }) => {
    const seeded: SeededWorkspace = await seedWorkspace({
      repoPrefix: "multiplicity-resume-seed-",
    });
    const sourceRepo = await createTempGitRepo("multiplicity-resume-source-");
    const existingDirectory = `${sourceRepo.path}-external-worktree`;
    execFileSync(
      "git",
      ["worktree", "add", "-b", "feat/resume-existing", existingDirectory, "main"],
      { cwd: sourceRepo.path, stdio: "ignore" },
    );
    let resumedWorkspaceId: string | null = null;

    try {
      await gotoAppShell(page);
      await waitForSidebarHydration(page);
      await openGlobalNewWorkspaceComposer(page);
      await selectWorkspaceIsolation(page, "resume");

      await expect(page.getByTestId("new-workspace-project-picker-trigger")).toContainText(
        seeded.projectDisplayName,
      );

      await page.getByTestId("new-workspace-resume-directory-trigger").click();
      const search = page.getByPlaceholder("Search or enter a directory path");
      await expect(search).toBeVisible({ timeout: 30_000 });
      await search.fill(existingDirectory.slice(0, -4));
      await page.getByRole("button", { name: existingDirectory, exact: true }).click();

      await submitNewWorkspaceEmpty(page);
      const resumed = await assertNewWorkspaceSidebarAndHeader(page, {
        serverId: getServerId(),
        client,
        previousWorkspaceId: seeded.workspaceId,
        projectDisplayName: seeded.projectDisplayName,
        assertSidebarRow: false,
        assertHeader: false,
      });
      resumedWorkspaceId = resumed.workspaceId;

      expect(resumed.workspaceDirectory).toBe(existingDirectory);
      const descriptor = (await client.fetchWorkspaces()).entries.find(
        (entry) => entry.id === resumed.workspaceId,
      );
      expect(descriptor?.workspaceKind).toBe("worktree");
      expect(descriptor?.projectId).toBe(seeded.projectId);

      const archiveResult = await client.archiveWorkspace(resumed.workspaceId);
      expect(archiveResult.error).toBeNull();
      resumedWorkspaceId = null;
      expect(existsSync(existingDirectory)).toBe(true);
    } finally {
      if (resumedWorkspaceId) await client.archiveWorkspace(resumedWorkspaceId);
      try {
        execFileSync("git", ["worktree", "remove", existingDirectory, "--force"], {
          cwd: sourceRepo.path,
          stdio: "ignore",
        });
      } catch {
        await rm(existingDirectory, { recursive: true, force: true });
      }
      await sourceRepo.cleanup();
      await seeded.cleanup();
    }
  });

  test("two Local workspaces appear under the same non-git project", async ({ page }) => {
    const seeded: SeededWorkspace = await seedWorkspace({
      repoPrefix: "multiplicity-local-nongit-",
      git: false,
    });

    try {
      const project = {
        projectKey: seeded.projectKey,
        projectDisplayName: seeded.projectDisplayName,
      };

      await gotoAppShell(page);
      await waitForSidebarHydration(page);
      // Model B: a non-git project is an expandable parent like any other, with
      // its single workspace already rendered as its own row underneath.
      await expect(
        page.getByTestId(`sidebar-project-row-${projectEquivalenceViewKey(seeded.projectKey)}`),
      ).toBeVisible({ timeout: 30_000 });
      await expect(page.getByTestId(workspaceRowTestId(seeded.workspaceId))).toBeVisible({
        timeout: 30_000,
      });

      const second = await createWorkspaceViaUi(page, {
        project,
        // Non-git project: no Isolation control, isolation is implicitly local.
        isolation: null,
        previousWorkspaceId: seeded.workspaceId,
        client,
      });

      expect(second.workspaceId).not.toBe(seeded.workspaceId);
      expect(second.workspaceDirectory).toBe(seeded.workspaceDirectory);

      // Both the original and the new workspace render as distinct rows under
      // the same expandable parent.
      await expect(
        page.getByTestId(`sidebar-project-row-${projectEquivalenceViewKey(seeded.projectKey)}`),
      ).toBeVisible({ timeout: 30_000 });
      await expect(page.getByTestId(workspaceRowTestId(seeded.workspaceId))).toBeVisible({
        timeout: 30_000,
      });
      const secondRow = page.getByTestId(workspaceRowTestId(second.workspaceId));
      await expect(secondRow).toBeVisible({ timeout: 30_000 });
      await expect(secondRow).toContainText(second.workspaceName);
    } finally {
      await seeded.cleanup();
    }
  });
});
