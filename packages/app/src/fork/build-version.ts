// Expo inlines this build-only value. Keep resolveAppVersion() unchanged so
// connected-host comparisons and update checks still use the package version.
export function forkVersionText(upstreamText: string): string {
  const buildVersion = process.env.EXPO_PUBLIC_PASEO_FORK_VERSION?.trim();
  return buildVersion ? `v${buildVersion}` : upstreamText;
}
