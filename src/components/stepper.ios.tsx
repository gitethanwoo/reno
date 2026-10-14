import { View } from "react-native";
import { Host, Stepper as NativeStepper } from "@expo/ui/swift-ui";
import { accessibilityValue, labelsHidden } from "@expo/ui/swift-ui/modifiers";
import { Copy } from "./ui";
import { colors, fonts } from "./theme";
import type { StepperProps } from "./stepper";

/** A labeled row with the native − / + stepper, like Reminders' early alerts. */
export function Stepper({
  label,
  value,
  onChange,
  min,
  max,
  format,
}: StepperProps) {
  return (
    <View
      style={{
        minHeight: 54,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.line,
        backgroundColor: colors.white,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
      }}
    >
      <Copy style={{ flex: 1, fontFamily: fonts.medium }}>{label}</Copy>
      <Copy style={{ fontVariant: ["tabular-nums"] }}>{format(value)}</Copy>
      <Host matchContents>
        <NativeStepper
          label={label}
          value={value}
          min={min}
          max={max}
          onValueChange={onChange}
          modifiers={[labelsHidden(), accessibilityValue(format(value))]}
        />
      </Host>
    </View>
  );
}
