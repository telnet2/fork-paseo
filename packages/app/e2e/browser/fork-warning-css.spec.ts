import path from "node:path";
import { test, expect } from "../support/fixtures";
import { seedWorkspace } from "../support/helpers/seed-client";
import { connectNewWorkspaceDaemonClient } from "../support/helpers/new-workspace";
import { openAgentRoute } from "../support/helpers/mock-agent";
import { openSettingsSection } from "../support/helpers/settings";

test("Trae skill warnings have configurable yellow text and survive reload", async ({
  page,
}, testInfo) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 1400, height: 900 });
  const workspace = await seedWorkspace({ repoPrefix: "fork-warning-" });
  const configClient = await connectNewWorkspaceDaemonClient();
  const previous = await configClient.getDaemonConfig();
  try {
    await configClient.patchDaemonConfig({
      providers: {
        traecli: {
          extends: "acp",
          label: "Trae warning fixture",
          enabled: true,
          command: [
            process.execPath,
            path.resolve(__dirname, "../support/fixtures/fork-trae-warning.cjs"),
          ],
        },
      },
    });
    const agent = await workspace.client.createAgent({
      provider: "traecli",
      cwd: workspace.repoPath,
      workspaceId: workspace.workspaceId,
      title: "Skill warning colors",
      initialPrompt: "Show the startup warning.",
    });
    await workspace.client.waitForFinish(agent.id, 30_000);
    const route = { workspaceId: workspace.workspaceId, agentId: agent.id };
    await openAgentRoute(page, route);
    const warnings = page.locator(
      '[data-paseo-notification="warning"] [data-paseo-notification-text]',
    );
    await expect(warnings).toHaveCount(2);
    await expect(warnings.first()).toContainText("Skill descriptions were shortened");
    await expect(warnings.first()).toHaveCSS("color", "rgb(244, 191, 79)");
    const answer = page
      .getByTestId("assistant-message")
      .getByText("Warning: this is ordinary assistant text.", { exact: true });
    await expect(answer).toBeVisible();
    const originalAnswerColor = await answer.evaluate((node) => getComputedStyle(node).color);
    expect(originalAnswerColor).not.toBe("rgb(244, 191, 79)");
    await page.screenshot({ path: testInfo.outputPath("warning-yellow.png") });

    async function applyCss(css: string) {
      await page.goto("/settings");
      await openSettingsSection(page, "appearance");
      await page.getByTestId("custom-css-editor").fill(css);
      await page.getByRole("button", { name: "Apply CSS", exact: true }).click();
      await openAgentRoute(page, route);
    }
    // Existing saved CSS may not define the new variable.
    await applyCss(":root { --paseo-content-max-width: none; }");
    await expect(warnings.first()).toHaveCSS("color", "rgb(245, 158, 11)");
    await applyCss(":root { --paseo-warning-color: #b45309; }");
    await expect(warnings.first()).toHaveCSS("color", "rgb(180, 83, 9)");
    await expect(answer).toHaveCSS("color", originalAnswerColor);
    await page.reload();
    await expect(warnings).toHaveCount(2);
    await expect(warnings.first()).toHaveCSS("color", "rgb(180, 83, 9)");
    await page.screenshot({ path: testInfo.outputPath("warning-custom.png") });
    await page.setViewportSize({ width: 390, height: 844 });
    const bounds = await warnings.first().boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(390);
    await page.goto("/settings");
    await openSettingsSection(page, "appearance");
    await page.getByRole("button", { name: "Reset CSS", exact: true }).click();
    await openAgentRoute(page, route);
    await expect(warnings.first()).toHaveCSS("color", "rgb(245, 158, 11)");
  } finally {
    try {
      await workspace.cleanup();
      if (previous.config.providers?.traecli) {
        await configClient.patchDaemonConfig({
          providers: { traecli: previous.config.providers.traecli },
        });
      } else {
        await configClient.patchDaemonConfig({ removeProviders: ["traecli"] });
      }
    } finally {
      await configClient.close();
    }
  }
});
