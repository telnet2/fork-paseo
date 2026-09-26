import { test, expect } from "../support/fixtures";
import { openSettingsSection } from "../support/helpers/settings";
import { openAgentRoute, seedMockAgentWorkspace } from "../support/helpers/mock-agent";

async function openCssSettings(page: Parameters<typeof openSettingsSection>[0]) {
  await page.goto("/settings");
  await openSettingsSection(page, "appearance");
  await expect(page.getByTestId("custom-css-editor")).toBeVisible();
}

test("saves CSS, widens the transcript, preserves narrow layouts, and resets", async ({
  page,
}, testInfo) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 1600, height: 1000 });
  const agent = await seedMockAgentWorkspace({
    repoPrefix: "fork-css-",
    title: "Custom CSS preview",
    model: "ten-second-stream",
    initialPrompt: "Show a short response.",
  });
  try {
    await openCssSettings(page);
    const editor = page.getByTestId("custom-css-editor");
    await expect(editor).toHaveValue(/--paseo-content-max-width: none/);
    await page.screenshot({ path: testInfo.outputPath("css-settings.png") });
    await page.getByRole("button", { name: "Reset CSS", exact: true }).click();
    await expect(editor).toHaveValue("");
    await page.getByRole("button", { name: "Wide & compact", exact: true }).click();
    await expect(editor).toHaveValue(/--paseo-content-max-width: none/);
    await page.getByRole("button", { name: "Reset CSS", exact: true }).click();
    await expect(editor).toHaveValue("");
    await openAgentRoute(page, agent);
    const assistant = page.getByTestId("assistant-message").last();
    await expect(assistant).toBeVisible({ timeout: 30_000 });
    const rows = page.locator('[data-paseo-content="transcript"]');
    await expect(rows.first()).toHaveCSS("max-width", "820px");
    await page.screenshot({ path: testInfo.outputPath("original.png") });

    await openCssSettings(page);
    const css = `:root {
      --paseo-content-max-width: none;
      --paseo-content-padding: 4px;
      --paseo-paragraph-gap: 8px;
      --paseo-assistant-padding: 4px;
      --paseo-activity-gap: 2px;
    }
    [data-paseo-content="composer"] { border-top: 3px solid rgb(20, 90, 160); }`;
    await editor.fill(css);
    await page.getByRole("button", { name: "Apply CSS", exact: true }).click();
    await expect(page.getByText("CSS saved and applied.", { exact: true })).toBeVisible();
    await page.reload();
    await expect(editor).toHaveValue(css);
    await openAgentRoute(page, agent);
    await expect(assistant).toBeVisible();
    await expect(rows.first()).toHaveCSS("max-width", "none");
    await expect(rows.first()).toHaveCSS("padding-left", "4px");
    await expect
      .poll(async () => (await rows.first().boundingBox())?.width ?? 0)
      .toBeGreaterThan(820);
    await expect(page.locator('[data-paseo-content="composer"]')).toHaveCSS(
      "border-top-width",
      "3px",
    );
    await expect(assistant.locator('[data-paseo-markdown-tag="p"]').first()).toHaveCSS(
      "margin-bottom",
      "8px",
    );
    await expect(page.locator('[data-paseo-gap="activity"]').first()).toHaveCSS(
      "margin-bottom",
      "2px",
    );
    await page.screenshot({ path: testInfo.outputPath("wide-compact.png") });

    await page.setViewportSize({ width: 390, height: 844 });
    await expect(assistant).toBeVisible();
    const bounds = await assistant.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(390);
    await page.screenshot({ path: testInfo.outputPath("narrow.png") });

    await page.setViewportSize({ width: 1600, height: 1000 });
    await openCssSettings(page);
    await page.getByRole("button", { name: "Reset CSS", exact: true }).click();
    await page.reload();
    await expect(editor).toHaveValue("");
    await openAgentRoute(page, agent);
    await expect(rows.first()).toHaveCSS("max-width", "820px");
    await expect(page.locator('[data-paseo-content="composer"]')).toHaveCSS(
      "border-top-width",
      "0px",
    );
  } finally {
    await agent.cleanup();
  }
});
