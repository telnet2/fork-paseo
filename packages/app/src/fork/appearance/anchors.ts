import type { StreamItem } from "@/types/stream";
import { SPACING } from "@/styles/theme";

export const appearanceDataSets = {
  transcript: { paseoContent: "transcript" },
  composer: { paseoContent: "composer" },
  tracks: { paseoContent: "tracks" },
  blockGap: { paseoBlockGap: "true" },
  blockLast: { paseoBlockGap: "false" },
  notificationText: { paseoNotificationText: "true" },
  activityCollapsed: { paseoActivity: "collapsed" },
  activityExpanded: { paseoActivity: "expanded" },
  activityHeader: { paseoActivityHeader: "true" },
  activityIcon: { paseoActivityIcon: "true" },
  activityOpenFile: { paseoActivityOpenFile: "true" },
};
const paragraphRow = { ...appearanceDataSets.transcript, paseoGap: "paragraph" };
const activityRow = { ...appearanceDataSets.transcript, paseoGap: "activity" };

// These gaps are assigned by agent-stream/spacing.ts. Zero compact edges and
// user/turn boundaries retain their original spacing.
export function streamRowDataSet(kind: StreamItem["kind"], gap: number) {
  if (kind === "assistant_message" && gap === SPACING[3]) return paragraphRow;
  if (kind !== "user_message" && gap === SPACING[1]) return activityRow;
  return appearanceDataSets.transcript;
}

export const notificationDataSets = {
  info: { paseoNotification: "info" },
  warning: { paseoNotification: "warning" },
  error: { paseoNotification: "error" },
};
