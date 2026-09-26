import { useCallback, useEffect, useRef, useState } from "react";
import { Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { useTranslation } from "react-i18next";
import { SettingsSection } from "@/components/settings/headings/settings-section";
import { Button } from "@/components/ui/button";
import type { EditingTextInputHandle } from "@/components/ui/text-input/types";
import { EditingTextInput } from "@/components/ui/text-input";
import { useCustomCss } from "./provider.web";
import { WIDE_COMPACT_CSS } from "./css";
import { APPEARANCE_NAMESPACE } from "./i18n";

export function CustomCssSection() {
  const { t } = useTranslation(APPEARANCE_NAMESPACE);
  const { css, save } = useCustomCss();
  const inputRef = useRef<EditingTextInputHandle>(null);
  const [draft, setDraft] = useState(css);
  const [status, setStatus] = useState<"saved" | "error" | null>(null);
  useEffect(() => {
    setDraft(css);
    inputRef.current?.replaceText(css);
  }, [css]);

  const edit = useCallback((value: string) => {
    setDraft(value);
    setStatus(null);
  }, []);
  const apply = useCallback(
    (value: string) => {
      try {
        save(value);
        setDraft(value);
        inputRef.current?.replaceText(value);
        setStatus("saved");
      } catch {
        setStatus("error");
      }
    },
    [save],
  );
  const applyDraft = useCallback(() => apply(draft), [apply, draft]);
  const preset = useCallback(() => {
    edit(WIDE_COMPACT_CSS);
    inputRef.current?.replaceText(WIDE_COMPACT_CSS);
  }, [edit]);
  const reset = useCallback(() => apply(""), [apply]);

  return (
    <SettingsSection title={t("title")} testID="custom-css-settings">
      <Text style={styles.hint}>{t("hint")}</Text>
      <EditingTextInput
        ref={inputRef}
        testID="custom-css-editor"
        accessibilityLabel={t("title")}
        multiline
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
        initialValue={draft}
        onChangeText={edit}
        style={styles.editor}
      />
      <View style={styles.actions}>
        <Button size="sm" onPress={applyDraft}>
          {t("apply")}
        </Button>
        <Button size="sm" variant="outline" onPress={preset}>
          {t("preset")}
        </Button>
        <Button size="sm" variant="ghost" onPress={reset}>
          {t("reset")}
        </Button>
      </View>
      {status ? (
        <Text
          accessibilityRole={status === "error" ? "alert" : undefined}
          style={status === "error" ? styles.error : styles.hint}
        >
          {t(status)}
        </Text>
      ) : null}
    </SettingsSection>
  );
}

const styles = StyleSheet.create((theme) => ({
  hint: { color: theme.colors.foregroundMuted, fontSize: theme.fontSize.base },
  error: { color: theme.colors.destructive, fontSize: theme.fontSize.base },
  editor: {
    minHeight: 220,
    maxHeight: 440,
    padding: theme.spacing[3],
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.base,
    backgroundColor: theme.colors.surface1,
    color: theme.colors.foreground,
    fontFamily: theme.fontFamily.mono,
    fontSize: theme.fontSize.code,
    textAlignVertical: "top",
  },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing[2] },
}));
