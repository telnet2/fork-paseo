import { StyleSheet } from "react-native-unistyles";

const styles = StyleSheet.create((theme) => ({
  warning: { color: theme.colors.palette.amber[500] },
}));

export function warningTextStyle(level: "info" | "warning" | "error") {
  return level === "warning" ? styles.warning : undefined;
}
