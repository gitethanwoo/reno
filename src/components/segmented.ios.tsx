import { View } from "react-native";
import { Host, Picker, Text } from "@expo/ui/swift-ui";
import {
  accessibilityLabel,
  pickerStyle,
  tag,
} from "@expo/ui/swift-ui/modifiers";
import { Copy } from "./ui";
import { fonts } from "./theme";
import type { SegmentedProps } from "./segmented";

/** A labeled native segmented control, like Settings' choice rows. */
export function Segmented({
  label,
  options,
  value,
  onChange,
  format,
}: SegmentedProps) {
  return (
    <View style={{ gap: 10 }}>
      <Copy style={{ fontFamily: fonts.medium, fontSize: 14 }}>{label}</Copy>
      <Host matchContents={{ vertical: true }}>
        <Picker
          selection={value}
          onSelectionChange={onChange}
          modifiers={[pickerStyle("segmented"), accessibilityLabel(label)]}
        >
          {options.map((o) => (
            <Text key={o} modifiers={[tag(o)]}>
              {format(o)}
            </Text>
          ))}
        </Picker>
      </Host>
    </View>
  );
}
