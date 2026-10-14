import React, { useId, useImperativeHandle, useRef, useState } from "react";
import {
  InputAccessoryView,
  Keyboard,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  ScrollViewProps,
  StyleSheet,
  Text,
  TextInput,
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
import { editAmount, formatAmount } from "@/lib/money-input";

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
  scrollRef,
  scroll,
}: {
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** Shown next to the footer's buttons, where the person is looking when they tap. */
  error?: string | null;
  keyboard?: boolean;
  padded?: boolean;
  scrollRef?: React.Ref<ScrollView>;
  /** Scroll events, for screens that follow their own position (a thread, a collapsing title). */
  scroll?: Pick<
    ScrollViewProps,
    | "onScroll"
    | "onContentSizeChange"
    | "onLayout"
    | "onScrollBeginDrag"
    | "keyboardDismissMode"
  >;
}) {
  const inset = useSafeAreaInsets();
  // KeyboardAvoidingView compares its own frame with the keyboard's screen
  // position, so it needs to know where it sits on screen: under a header,
  // inside a modal sheet, or full screen. Measured, not guessed.
  const frame = useRef<View>(null);
  const [top, setTop] = useState(0);
  return (
    <View
      ref={frame}
      style={s.flex}
      onLayout={() => frame.current?.measureInWindow((_x, y) => setTop(y))}
    >
      <KeyboardAvoidingView
        style={s.flex}
        behavior={
          keyboard && process.env.EXPO_OS === "ios" ? "padding" : undefined
        }
        // With the keyboard up, the footer's home-indicator padding sits
        // behind the keyboard instead of floating as a gap above it.
        keyboardVerticalOffset={
          top - (footer ? Math.max(inset.bottom - 18, 0) : 0)
        }
      >
        <ScrollView
          ref={scrollRef}
          {...scroll}
          // Not "interactive": KeyboardAvoidingView doesn't follow the drag, so the footer would lag behind the keyboard.
          keyboardDismissMode={scroll?.keyboardDismissMode ?? "on-drag"}
          scrollEventThrottle={scroll?.onScroll ? 16 : undefined}
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
    </View>
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
      onPress={onPress}
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
  onPress,
  label,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  /** Makes the whole card one tap target, like a list cell. */
  onPress?: () => void;
  label?: string;
}) {
  const card = (
    <Surface elevation={0} style={[s.card, style]}>
      {children}
    </Surface>
  );
  return onPress ? (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => pressed && { opacity: 0.7 }}
    >
      {card}
    </Pressable>
  ) : (
    card
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
/** What a Field's `ref` can do, e.g. `next.current?.focus()`. */
export type FieldHandle = Pick<TextInput, "focus" | "blur">;
const numberPads = ["number-pad", "decimal-pad", "numeric"];
export function Field({
  label,
  error,
  ref,
  onNext,
  ...props
}: Omit<TextInputProps, "selectionColor" | "cursorColor"> & {
  label: string;
  error?: string;
  ref?: React.Ref<FieldHandle>;
  /** Return (or the number pad's Next) moves here instead of closing the keyboard. */
  onNext?: () => void;
}) {
  const bar = useId();
  // Paper's ref type claims a whole TextInput but hands back only a few
  // methods, so pass on just the ones a form needs.
  const input = useRef<FieldHandle | null>(null);
  useImperativeHandle(ref, () => ({
    focus: () => input.current?.focus(),
    blur: () => input.current?.blur(),
  }));
  const numberPad = numberPads.includes(props.keyboardType ?? "");
  return (
    <View style={{ gap: 9 }}>
      <PaperInput
        ref={(handle: FieldHandle | null) => {
          input.current = handle;
        }}
        mode="outlined"
        label={label}
        accessibilityLabel={label}
        error={!!error}
        placeholderTextColor="#8B928B"
        // Single-line fields say what Return does: Next, or Done.
        returnKeyType={props.multiline ? undefined : onNext ? "next" : "done"}
        inputAccessoryViewID={numberPad ? bar : undefined}
        {...props}
        {...(onNext && {
          onSubmitEditing: onNext,
          // Keep the keyboard up while focus moves, so nothing jumps.
          submitBehavior: "submit" as const,
          blurOnSubmit: false,
        })}
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
      {numberPad && <KeyboardBar id={bar} onNext={onNext} />}
      {error && <Copy tone="rust">{error}</Copy>}
    </View>
  );
}
/**
 * iOS number pads have no Return key, so they get Next / Done above the
 * keyboard, like Contacts. Other platforms have their own way out.
 */
function KeyboardBar({ id, onNext }: { id: string; onNext?: () => void }) {
  if (process.env.EXPO_OS !== "ios") return null;
  return (
    <InputAccessoryView nativeID={id}>
      <View style={s.keyboardBar}>
        {onNext && (
          <Pressable
            accessibilityRole="button"
            hitSlop={8}
            onPress={onNext}
            style={s.keyboardBarButton}
          >
            <Text style={[s.keyboardBarText, { fontFamily: fonts.regular }]}>
              Next
            </Text>
          </Pressable>
        )}
        <Pressable
          accessibilityRole="button"
          hitSlop={8}
          onPress={Keyboard.dismiss}
          style={s.keyboardBarButton}
        >
          <Text style={s.keyboardBarText}>Done</Text>
        </Pressable>
      </View>
    </InputAccessoryView>
  );
}
/** One large, centered amount that formats as currency while typing, like Cash App. */
export function AmountField({
  label,
  value,
  onChange,
  autoFocus,
}: {
  label: string;
  /** The raw amount, e.g. "1440.5". */
  value: string;
  onChange: (raw: string) => void;
  autoFocus?: boolean;
}) {
  const bar = useId();
  return (
    <View style={{ alignItems: "center", gap: 4 }}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        keyboardType="decimal-pad"
        inputAccessoryViewID={bar}
        autoFocus={autoFocus}
        placeholder="$0"
        placeholderTextColor={colors.line}
        selectionColor={colors.ink}
        cursorColor={colors.ink}
        value={formatAmount(value)}
        onChangeText={(text) => onChange(editAmount(value, text))}
        style={s.amount}
      />
      <KeyboardBar id={bar} />
    </View>
  );
}
/** One-tap suggestions that fill in a field. Unlike Chips, nothing stays selected. */
export function Suggestions({
  options,
}: {
  options: { label: string; onPress: () => void }[];
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: 8,
      }}
    >
      {options.map((o) => (
        <Pressable
          key={o.label}
          accessibilityRole="button"
          onPress={o.onPress}
          style={s.chip}
        >
          <Text
            style={{
              fontFamily: fonts.medium,
              fontSize: 15,
              color: colors.ink,
            }}
          >
            {o.label}
          </Text>
        </Pressable>
      ))}
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
      onValueChange={(v) => {
        const picked = options.find((option) => option.value === v);
        if (!picked || picked.value === value) return;
        if (process.env.EXPO_OS === "ios")
          void Haptics.selectionAsync().catch(() => {});
        onChange(picked.value);
      }}
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
  amount: {
    alignSelf: "stretch",
    minHeight: 72,
    fontFamily: fonts.bold,
    fontSize: 56,
    letterSpacing: -1,
    fontVariant: ["tabular-nums"],
    textAlign: "center",
    color: colors.ink,
  },
  keyboardBar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    paddingHorizontal: 8,
    backgroundColor: colors.paper,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
  },
  keyboardBarButton: {
    minHeight: 44,
    paddingHorizontal: 12,
    justifyContent: "center",
  },
  keyboardBarText: { fontFamily: fonts.bold, fontSize: 17, color: colors.ink },
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
