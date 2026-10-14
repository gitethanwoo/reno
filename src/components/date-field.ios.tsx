import { View } from "react-native";
import { DatePicker, Host } from "@expo/ui/swift-ui";
import { dayOf, fromDay } from "@/lib/date";
import { Copy } from "./ui";
import { colors, fonts } from "./theme";
import type { DateFieldProps } from "./date-field";

/** A labeled row with the compact iOS date picker, like Calendar's event editor. */
export function DateField({
  label,
  value,
  onChange,
  min,
  max,
}: DateFieldProps) {
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
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      <Copy style={{ fontFamily: fonts.medium }}>{label}</Copy>
      <Host matchContents>
        <DatePicker
          selection={fromDay(value)}
          range={{
            start: min ? fromDay(min) : undefined,
            end: max ? fromDay(max) : undefined,
          }}
          displayedComponents={["date"]}
          onDateChange={(date) => onChange(dayOf(date))}
        />
      </Host>
    </View>
  );
}
