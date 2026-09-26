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
    await agent.client.waitForFinish(agent.agentId, 30_000);
    await agent.client.sendAgentMessage(
      agent.agentId,
      "Show another response for outline navigation.",
    );
    await agent.client.waitForFinish(agent.agentId, 30_000);
    await page.addInitScript(() => {
      localStorage.setItem(
        "@paseo:app-settings",
        JSON.stringify({ toolCallDetailLevel: "overview", contentFontSize: 15 }),
      );
    });
    await openCssSettings(page);
    const editor = page.getByTestId("custom-css-editor");
    await expect(editor).toHaveValue(/--paseo-content-max-width: none/);
    await page.screenshot({ path: testInfo.outputPath("css-settings.png") });
    await page.getByRole("button", { name: "Reset CSS", exact: true }).click();
    await expect(editor).toHaveValue("");
    await page.getByRole("button", { name: "Wide & compact", exact: true }).click();
    await expect(editor).toHaveValue(/--paseo-content-max-width: none/);
    const presetCss = await editor.inputValue();
    await page.getByRole("button", { name: "Reset CSS", exact: true }).click();
    await expect(editor).toHaveValue("");
    await openAgentRoute(page, agent);
    const assistant = page.getByTestId("assistant-message").last();
    await expect(assistant).toBeVisible({ timeout: 30_000 });
    const rows = page.locator('[data-paseo-content="transcript"]');
    await expect(rows.first()).toHaveCSS("max-width", "820px");
    await expect(page.locator("[data-paseo-activity-header]").first()).toHaveCSS("height", "32px");
    await page.screenshot({ path: testInfo.outputPath("original.png") });

    await openCssSettings(page);
    const css = `${presetCss}
[data-paseo-content="composer"] { border-top: 3px solid rgb(20, 90, 160); }`;
    await editor.fill(css);
    await page.getByRole("button", { name: "Apply CSS", exact: true }).click();
    await expect(page.getByText("CSS saved and applied.", { exact: true })).toBeVisible();
    await page.reload();
    await expect(editor).toHaveValue(css);
    await openAgentRoute(page, agent);
    await expect(assistant).toBeVisible();
    await expect(rows.first()).toHaveCSS("max-width", "none");
    await expect(rows.first()).toHaveCSS("padding-left", "48px");
    await expect
      .poll(async () => (await rows.first().boundingBox())?.width ?? 0)
      .toBeGreaterThan(820);
    await expect(page.locator('[data-paseo-content="composer"]')).toHaveCSS(
      "border-top-width",
      "3px",
    );
    await expect(assistant.locator('[data-paseo-markdown-tag="p"]').first()).toHaveCSS(
      "margin-bottom",
      "4px",
    );
    await expect(page.locator('[data-paseo-gap="activity"]').first()).toHaveCSS(
      "margin-bottom",
      "0px",
    );
    const activityHeaders = page.locator(
      '[data-paseo-activity="collapsed"] [data-paseo-activity-header]',
    );
    const paragraphLineHeight = await page
      .locator('[data-paseo-assistant-spacing] [data-paseo-markdown-tag="p"]')
      .evaluateAll((paragraphs) => {
        for (const paragraph of paragraphs) {
          const walker = document.createTreeWalker(paragraph, NodeFilter.SHOW_TEXT);
          for (let node = walker.nextNode(); node; node = walker.nextNode()) {
            const range = document.createRange();
            range.selectNodeContents(node);
            const tops = [
              ...new Set(
                [...range.getClientRects()]
                  .filter((rect) => rect.height > 0)
                  .map((rect) => rect.top),
              ),
            ];
            if (tops.length >= 2) return tops[1] - tops[0];
          }
        }
        throw new Error("Expected a wrapped paragraph to measure its line spacing");
      });
    expect(paragraphLineHeight).toBe(21);
    const firstActivity = activityHeaders.first();
    await expect(firstActivity).toHaveCSS("height", `${paragraphLineHeight}px`);
    const firstTwo = await activityHeaders.evaluateAll((elements) =>
      elements.slice(0, 2).map((element) => element.getBoundingClientRect().top),
    );
    expect(firstTwo).toHaveLength(2);
    expect(firstTwo[1] - firstTwo[0]).toBe(paragraphLineHeight);

    const outline = page.getByTestId("chat-outline-rail");
    await expect(outline).toBeVisible();
    const outlineBounds = await outline.boundingBox();
    const activityBounds = await firstActivity.boundingBox();
    expect(outlineBounds).not.toBeNull();
    expect(activityBounds).not.toBeNull();
    expect(activityBounds!.x).toBeGreaterThanOrEqual(outlineBounds!.x + outlineBounds!.width + 4);

    // The compact rule must not constrain expanded details or change hover geometry.
    const group = page.getByTestId("tool-call-group").first();
    const groupHeader = group.locator("[data-paseo-activity-header]").first();
    await groupHeader.hover();
    await expect(groupHeader).toHaveCSS("height", "21px");
    await groupHeader.click();
    await expect(group).toHaveAttribute("data-paseo-activity", "expanded");
    await expect(groupHeader).toHaveCSS("height", "32px");
    await groupHeader.click();
    await expect(group).toHaveAttribute("data-paseo-activity", "collapsed");
    await expect(groupHeader).toHaveCSS("height", "21px");
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
