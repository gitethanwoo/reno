import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  TextInputProps,
  TextProps,
  View,
  ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import {
  Button as PaperButton,
  IconButton as PaperIconButton,
  Surface,
  TextInput as PaperInput,
  SegmentedButtons,
  TouchableRipple,
} from "react-native-paper";
import { colors, fonts } from "./theme";
import { Icon, IconName } from "./icon";

export function Copy({
  children,
  tone,
  style,
  ...props
}: TextProps & { tone?: "muted" | "rust" }) {
  return (
    <Text
      selectable
      {...props}
      style={[s.body, tone && { color: colors[tone] }, style]}
    >
      {children}
    </Text>
  );
}
export function Heading({
  children,
  small = false,
}: {
  children: React.ReactNode;
  small?: boolean;
}) {
  return (
    <Text accessibilityRole="header" selectable style={small ? s.h2 : s.h1}>
      {children}
    </Text>
  );
}
export function Eyebrow({ children }: { children: React.ReactNode }) {
  return <Text style={s.eyebrow}>{children}</Text>;
}
export function Wordmark() {
  return (
    <View style={{ flexDirection: "row", alignItems: "baseline" }}>
      <Text
        style={{
          fontFamily: fonts.serif,
          fontSize: 36,
          color: colors.ink,
          letterSpacing: -1.5,
        }}
      >
        reno
      </Text>
      <View
        style={{
          width: 8,
          height: 8,
          marginLeft: 3,
          backgroundColor: colors.rust,
        }}
      />
    </View>
  );
}
export function Screen({
  children,
  footer,
  keyboard = false,
  padded = true,
}: {
  children: React.ReactNode;
  footer?: React.ReactNode;
  keyboard?: boolean;
  padded?: boolean;
}) {
  const inset = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView
      style={s.flex}
      behavior={
        keyboard && process.env.EXPO_OS === "ios" ? "padding" : undefined
      }
      keyboardVerticalOffset={100}
    >
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingHorizontal: padded ? 24 : 0,
          paddingTop: 18,
          paddingBottom: footer ? 24 : Math.max(inset.bottom, 24) + 24,
          gap: 24,
          maxWidth: 660,
          width: "100%",
          alignSelf: "center",
        }}
      >
        {children}
      </ScrollView>
      {footer && (
        <View
          style={{
            padding: 20,
            paddingBottom: Math.max(inset.bottom, 18),
            backgroundColor: colors.paper,
            borderTopColor: colors.line,
            borderTopWidth: 1,
          }}
        >
          <View style={{ maxWidth: 612, width: "100%", alignSelf: "center" }}>
            {footer}
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}
export function Button({
  title,
  onPress,
  variant = "primary",
  icon,
  disabled,
  busy,
  testID,
}: {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "quiet" | "danger";
  icon?: IconName;
  disabled?: boolean;
  busy?: boolean;
  testID?: string;
}) {
  const dark = variant === "primary" || variant === "danger";
  return (
    <PaperButton
      testID={testID}
      accessibilityLabel={title}
      disabled={disabled || busy}
      loading={busy}
      mode={
        variant === "secondary"
          ? "outlined"
          : variant === "quiet"
            ? "text"
            : "contained"
      }
      buttonColor={
        variant === "primary"
          ? colors.ink
          : variant === "danger"
            ? colors.rust
            : undefined
      }
      textColor={dark ? colors.white : colors.ink}
      icon={
        icon
          ? ({ color, size }) => <Icon name={icon} color={color} size={size} />
          : undefined
      }
      onPress={() => {
        if (process.env.EXPO_OS === "ios")
          void Haptics.selectionAsync().catch(() => {});
        onPress();
      }}
      contentStyle={{ minHeight: 54, flexDirection: "row-reverse" }}
      labelStyle={{ fontFamily: fonts.bold, fontSize: 16 }}
      style={{ borderRadius: 12, borderColor: colors.line }}
    >
      {title}
    </PaperButton>
  );
}
export function IconButton({
  name,
  label,
  onPress,
}: {
  name: IconName;
  label: string;
  onPress: () => void;
}) {
  return (
    <PaperIconButton
      accessibilityLabel={label}
      icon={({ color, size }) => <Icon name={name} color={color} size={size} />}
      onPress={onPress}
      size={24}
      style={{ margin: 0, width: 48, height: 48 }}
    />
  );
}
export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return (
    <Surface elevation={0} style={[s.card, style]}>
      {children}
    </Surface>
  );
}
export function Badge({
  children,
  warm = false,
}: {
  children: React.ReactNode;
  warm?: boolean;
}) {
  return (
    <View style={[s.badge, warm && { backgroundColor: colors.amber }]}>
      <Text
        style={{
          fontFamily: fonts.medium,
          fontSize: 12,
          color: warm ? "#805122" : colors.ink,
        }}
      >
        {children}
      </Text>
    </View>
  );
}
export function Row({
  title,
  detail,
  icon,
  onPress,
}: {
  title: string;
  detail?: string;
  icon?: IconName;
  onPress?: () => void;
}) {
  const content = (
    <View style={s.row}>
      {icon && (
        <View style={s.iconTile}>
          <Icon name={icon} size={21} />
        </View>
      )}
      <View style={{ flex: 1, gap: 4 }}>
        <Copy style={{ fontFamily: fonts.medium }}>{title}</Copy>
        {detail && (
          <Copy tone="muted" style={{ fontSize: 13 }}>
            {detail}
          </Copy>
        )}
      </View>
      {onPress && <Icon name="chevron" size={18} />}
    </View>
  );
  return onPress ? (
    <TouchableRipple
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
    >
      {content}
    </TouchableRipple>
  ) : (
    content
  );
}
export function Field({
  label,
  error,
  ...props
}: Omit<TextInputProps, "selectionColor" | "cursorColor"> & {
  label: string;
  error?: string;
}) {
  return (
    <View style={{ gap: 9 }}>
      <PaperInput
        mode="outlined"
        label={label}
        accessibilityLabel={label}
        error={!!error}
        placeholderTextColor="#8B928B"
        {...props}
        outlineStyle={{ borderRadius: 12 }}
        outlineColor={colors.line}
        activeOutlineColor={colors.ink}
        contentStyle={{
          minHeight: props.multiline ? 120 : 54,
          fontFamily: fonts.regular,
          fontSize: 16,
        }}
        style={[{ backgroundColor: colors.white }, props.style]}
      />
      {error && <Copy tone="rust">{error}</Copy>}
    </View>
  );
}
export function Segments<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <SegmentedButtons
      value={value}
      onValueChange={(v) => onChange(v as T)}
      buttons={options.map((option) => ({
        ...option,
        style: { minHeight: 48 },
        labelStyle: { fontFamily: fonts.medium, fontSize: 13 },
        checkedColor: colors.ink,
        uncheckedColor: colors.muted,
      }))}
    />
  );
}
export function Note({
  children,
  warning = false,
}: {
  children: React.ReactNode;
  warning?: boolean;
}) {
  return (
    <View
      style={{
        padding: 16,
        borderRadius: 12,
        backgroundColor: warning ? colors.amber : colors.sage,
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 10,
      }}
    >
      <Icon name={warning ? "bell" : "file"} size={18} />
      <Copy style={{ fontSize: 13, lineHeight: 20, flex: 1 }}>{children}</Copy>
    </View>
  );
}
export function Empty({
  title,
  text,
  action,
}: {
  title: string;
  text: string;
  action?: React.ReactNode;
}) {
  return (
    <Card style={{ gap: 16, paddingVertical: 32 }}>
      <Icon name="projects" size={32} />
      <Heading small>{title}</Heading>
      <Copy tone="muted">{text}</Copy>
      {action}
    </Card>
  );
}
export function Divider() {
  return <View style={{ height: 1, backgroundColor: colors.line }} />;
}
export function useTask() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ref = React.useRef(false);
  async function run(task: () => Promise<void>) {
    if (ref.current) return;
    ref.current = true;
    setBusy(true);
    setError(null);
    try {
      await task();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "That could not be saved. Please try again.",
      );
    } finally {
      setBusy(false);
      ref.current = false;
    }
  }
  return { busy, error, run, clear: () => setError(null) };
}
export function ErrorNote({ error }: { error: string | null }) {
  return error ? (
    <View accessibilityRole="alert">
      <Note warning>{error}</Note>
    </View>
  ) : null;
}
const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.paper },
  body: {
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 24,
    color: colors.ink,
  },
  h1: {
    fontFamily: fonts.serif,
    fontSize: 42,
    lineHeight: 46,
    letterSpacing: -0.9,
    color: colors.ink,
  },
  h2: {
    fontFamily: fonts.serif,
    fontSize: 27,
    lineHeight: 32,
    letterSpacing: -0.35,
    color: colors.ink,
  },
  eyebrow: {
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 1.7,
    textTransform: "uppercase",
    color: colors.rust,
  },
  label: { fontFamily: fonts.medium, color: colors.ink, fontSize: 14 },
  input: {
    minHeight: 54,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    padding: 16,
    color: colors.ink,
    fontFamily: fonts.regular,
    fontSize: 16,
  },
  button: {
    minHeight: 54,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    borderWidth: 1,
  },
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    padding: 20,
    gap: 16,
    borderCurve: "continuous",
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: colors.lime,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 7,
  },
  row: {
    minHeight: 64,
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    paddingVertical: 8,
  },
  iconTile: {
    height: 42,
    width: 42,
    borderRadius: 12,
    backgroundColor: colors.sage,
    alignItems: "center",
    justifyContent: "center",
  },
  segments: {
    flexDirection: "row",
    backgroundColor: "#ECECE3",
    padding: 4,
    borderRadius: 12,
    gap: 2,
  },
  segment: {
    minHeight: 44,
    flex: 1,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
});
