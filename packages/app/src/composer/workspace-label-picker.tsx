import { useCallback, type ReactElement } from "react";
import { Text } from "react-native";
import { StyleSheet, withUnistyles } from "react-native-unistyles";
import { useTranslation } from "react-i18next";
import { Tag } from "lucide-react-native";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Theme } from "@/styles/theme";
import {
  WorkspaceLabelPickerPage,
  useWorkspaceLabelMenuPages,
  type WorkspaceLabelTarget,
} from "@/workspace-labels/picker";

const ThemedTag = withUnistyles(Tag);
const foregroundMapping = (theme: Theme) => ({ color: theme.colors.foreground });
const foregroundMutedMapping = (theme: Theme) => ({ color: theme.colors.foregroundMuted });

/** Assigns labels without making you leave the workspace composer. */
export function ComposerWorkspaceLabelPicker({
  target,
}: {
  target: WorkspaceLabelTarget;
}): ReactElement {
  const { t } = useTranslation();
  const pages = useWorkspaceLabelMenuPages(target);
  const title = t("workspaceLabels.title");
  const renderIcon = useCallback(
    ({ hovered, open }: { hovered?: boolean; open: boolean }) => (
      <ThemedTag
        size={16}
        uniProps={
          hovered || open || target.labels.length > 0 ? foregroundMapping : foregroundMutedMapping
        }
      />
    ),
    [target.labels.length],
  );
  const triggerStyle = useCallback(
    ({ hovered, pressed, open }: { hovered?: boolean; pressed: boolean; open: boolean }) => [
      styles.trigger,
      (hovered || pressed || open || target.labels.length > 0) && styles.triggerActive,
    ],
    [target.labels.length],
  );

  return (
    <DropdownMenu compactMode="sheet">
      <Tooltip delayDuration={0} enabledOnDesktop enabledOnMobile={false}>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger
            accessibilityLabel={title}
            accessibilityRole="button"
            testID="composer-workspace-labels"
            style={triggerStyle}
          >
            {renderIcon}
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="top" align="center" offset={8}>
          <Text style={styles.tooltipText}>{title}</Text>
        </TooltipContent>
      </Tooltip>
      <DropdownMenuContent
        side="top"
        align="start"
        offset={8}
        width={260}
        pages={pages}
        sheetTitle={title}
        testID="composer-workspace-label-menu"
      >
        <WorkspaceLabelPickerPage
          serverId={target.serverId}
          workspaceId={target.workspaceId}
          assignedLabels={target.labels}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const styles = StyleSheet.create((theme) => ({
  trigger: {
    width: 28,
    height: 28,
    borderRadius: theme.borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  triggerActive: {
    backgroundColor: theme.colors.surface2,
  },
  tooltipText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.popoverForeground,
  },
}));
