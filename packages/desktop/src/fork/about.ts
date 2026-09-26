import { app } from "electron";
import { readFileSync } from "node:fs";
import path from "node:path";

export function configureForkAboutPanel(): void {
  const metadata = JSON.parse(
    readFileSync(path.join(app.getAppPath(), "package.json"), "utf8"),
  ) as {
    paseoForkBuild?: { buildLabel?: unknown };
  };
  const buildLabel = metadata.paseoForkBuild?.buildLabel;
  if (typeof buildLabel !== "string") return;
  // macOS displays the build label alongside its normal application version.
  app.setAboutPanelOptions({ applicationVersion: app.getVersion(), version: buildLabel });
}
