import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Pressable,
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
  display = false,
}: {
  children: React.ReactNode;
  small?: boolean;
  display?: boolean;
}) {
  return (
    <Text
      accessibilityRole="header"
      selectable
      style={small ? s.h2 : display ? s.display : s.h1}
    >
      {children}
    </Text>
  );
}
/** Screen title with an optional one-line explanation underneath. */
export function Title({
  children,
  eyebrow,
  sub,
}: {
  children: React.ReactNode;
  eyebrow?: string;
  sub?: React.ReactNode;
}) {
  return (
    <View style={{ gap: 8 }}>
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <Heading>{children}</Heading>
      {sub && <Copy tone="muted">{sub}</Copy>}
    </View>
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
  error = null,
}: {
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** Shown next to the footer's buttons, where the person is looking when they tap. */
  error?: string | null;
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
        {!footer && <ErrorNote error={error} />}
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
          <View
            style={{
              maxWidth: 612,
              width: "100%",
              alignSelf: "center",
              gap: 12,
            }}
          >
            <ErrorNote error={error} />
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
/** Label on the left, value on the right. Use for money, dates and counts. */
export function LineItem({
  label,
  value,
  strong = false,
  tone,
}: {
  label: string;
  value: string;
  strong?: boolean;
  tone?: "muted" | "rust";
}) {
  return (
    <View style={s.lineItem}>
      <Copy
        tone={strong ? undefined : "muted"}
        style={[{ flex: 1 }, strong && { fontFamily: fonts.medium }]}
      >
        {label}
      </Copy>
      <Copy
        tone={tone}
        style={[s.figure, strong && { fontFamily: fonts.bold, fontSize: 18 }]}
      >
        {value}
      </Copy>
    </View>
  );
}
/** Underlined text tabs. Labels never truncate; the row scrolls if needed. */
export function Tabs<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T; count?: number }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{
        flexGrow: 0,
        borderBottomWidth: 1,
        borderBottomColor: colors.line,
      }}
      contentContainerStyle={{ gap: 22 }}
      accessibilityRole="tablist"
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(o.value)}
            style={{
              minHeight: 44,
              justifyContent: "center",
              borderBottomWidth: 2,
              borderBottomColor: active ? colors.ink : "transparent",
              marginBottom: -1,
            }}
          >
            <Text
              style={{
                fontFamily: active ? fonts.bold : fonts.medium,
                fontSize: 15,
                color: active ? colors.ink : colors.muted,
              }}
            >
              {o.label}
              {o.count ? (
                <Text style={{ color: colors.rust }}> · {o.count}</Text>
              ) : null}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
/** Single-choice chips that wrap instead of truncating. */
export function Chips<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label?: string;
  options: { label: string; value: T }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View style={{ gap: 10 }}>
      {label && <Text style={s.label}>{label}</Text>}
      <View
        accessibilityRole="radiogroup"
        style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}
      >
        {options.map((o) => {
          const active = o.value === value;
          return (
            <Pressable
              key={o.value}
              accessibilityRole="radio"
              accessibilityState={{ checked: active }}
              onPress={() => onChange(o.value)}
              style={[s.chip, active && s.chipActive]}
            >
              {active && <Icon name="check" size={16} color={colors.white} />}
              <Text
                style={{
                  fontFamily: fonts.medium,
                  fontSize: 15,
                  color: active ? colors.white : colors.ink,
                }}
              >
                {o.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
export function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
      onPress={() => onChange(!checked)}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        minHeight: 48,
      }}
    >
      <View style={[s.box, checked && s.boxChecked]}>
        {checked && <Icon name="check" size={16} color={colors.white} />}
      </View>
      <Copy style={{ flex: 1, fontFamily: fonts.medium }}>{label}</Copy>
    </Pressable>
  );
}
/** A checklist line whose state is carried by icon and text, not color alone. */
export function Check({ done, children }: { done: boolean; children: string }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        minHeight: 40,
      }}
    >
      <View
        style={[
          s.checkDot,
          done ? { backgroundColor: colors.ink } : { borderColor: colors.rust },
        ]}
      >
        <Icon
          name={done ? "check" : "close"}
          size={13}
          color={done ? colors.white : colors.rust}
        />
      </View>
      <Copy style={{ flex: 1 }}>{children}</Copy>
    </View>
  );
}
export const plural = (n: number, one: string, many = one + "s") =>
  `${n} ${n === 1 ? one : many}`;
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
  display: {
    fontFamily: fonts.serif,
    fontSize: 42,
    lineHeight: 46,
    letterSpacing: -0.9,
    color: colors.ink,
  },
  h1: {
    fontFamily: fonts.serif,
    fontSize: 34,
    lineHeight: 38,
    letterSpacing: -0.6,
    color: colors.ink,
  },
  h2: {
    fontFamily: fonts.serif,
    fontSize: 24,
    lineHeight: 29,
    letterSpacing: -0.3,
    color: colors.ink,
  },
  figure: {
    fontFamily: fonts.medium,
    fontVariant: ["tabular-nums"],
    textAlign: "right",
  },
  lineItem: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 12,
    minHeight: 32,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
  },
  chipActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  box: {
    width: 26,
    height: 26,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: colors.muted,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
  },
  boxChecked: { backgroundColor: colors.ink, borderColor: colors.ink },
  checkDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  eyebrow: {
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 1.7,
    textTransform: "uppercase",
    color: colors.rust,
  },
  label: { fontFamily: fonts.medium, color: colors.ink, fontSize: 14 },
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
});
