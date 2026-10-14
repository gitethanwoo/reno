import { View } from "react-native";
import { Copy, IconButton } from "./ui";
import { colors, fonts } from "./theme";

export type StepperProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  /** How the value reads, e.g. 3 → "3 days". */
  format: (value: number) => string;
};

/** Fallback for web and Android: − value + buttons. iOS uses the native stepper. */
export function Stepper({
  label,
  value,
  onChange,
  min,
  max,
  format,
}: StepperProps) {
  const step = (by: number) =>
    onChange(Math.min(max, Math.max(min, value + by)));
  return (
    <View
      style={{
        minHeight: 54,
        paddingLeft: 16,
        paddingRight: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.line,
        backgroundColor: colors.white,
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
      }}
    >
      <Copy style={{ flex: 1, fontFamily: fonts.medium }}>{label}</Copy>
      <IconButton
        name="minus"
        label={"Fewer " + label.toLowerCase()}
        onPress={() => step(-1)}
      />
      <Copy
        accessibilityLiveRegion="polite"
        style={{
          minWidth: 64,
          textAlign: "center",
          fontVariant: ["tabular-nums"],
        }}
      >
        {format(value)}
      </Copy>
      <IconButton
        name="plus"
        label={"More " + label.toLowerCase()}
        onPress={() => step(1)}
      />
    </View>
  );
}
