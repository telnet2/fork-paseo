import { test, expect } from "../support/fixtures";
import { openSettingsSection } from "../support/helpers/settings";
import appPackage from "../../package.json";

test("About shows the build identity supplied to the renderer", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1400, height: 900 });
  await page.goto("/settings");
  await openSettingsSection(page, "about");
  const expectedVersion = process.env.EXPO_PUBLIC_PASEO_FORK_VERSION?.trim() || appPackage.version;
  await expect(page.getByText(`v${expectedVersion}`, { exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("fork-version.png") });
});
