import { useTranslation } from "react-i18next";
import { memo } from "react";
import { Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { AgentQueueStatus } from "@getpaseo/protocol/fork/queue-status";
import { ComposerTrackPill, ComposerTrackRow } from "@/composer/tracks";
import { queueStatusLabel } from "./queue-status";

export const QueueStatusPill = memo(function QueueStatusPill({
  status,
}: {
  status: AgentQueueStatus | null;
}) {
  const { t } = useTranslation("forkQueue");
  if (!status) return null;
  const label = queueStatusLabel(status);
  const operation = status.operation === "context_compaction" ? t("compaction") : t("response");
  return (
    <ComposerTrackPill
      testID="agent-queue-status"
      segments={[{ bucket: "running", text: label }]}
      panelTitle={t("waiting")}
      accessibilityLabel={label}
    >
      <ComposerTrackRow>
        <View style={styles.details}>
          <Text style={styles.label}>{operation}</Text>
          {status.position !== null ? (
            <Text style={styles.message}>{t("positionDetail", { position: status.position })}</Text>
          ) : null}
          {status.message ? <Text style={styles.message}>{status.message}</Text> : null}
        </View>
      </ComposerTrackRow>
    </ComposerTrackPill>
  );
});

const styles = StyleSheet.create((theme) => ({
  details: { flex: 1, minWidth: 0, gap: theme.spacing[1] },
  label: { color: theme.colors.foreground, fontSize: theme.fontSize.base },
  message: { color: theme.colors.foregroundMuted, fontSize: theme.fontSize.sm },
}));
