import type { ComponentProps } from "react";
import { Button, Host, Menu } from "@expo/ui/swift-ui";
import { labelStyle, tint } from "@expo/ui/swift-ui/modifiers";
import type { IconName } from "./icon";
import { colors } from "./theme";
import type { ActionMenuProps } from "./action-menu";

const symbols: Partial<
  Record<IconName, ComponentProps<typeof Button>["systemImage"]>
> = {
  money: "dollarsign.circle",
  tools: "wrench.and.screwdriver",
  message: "bubble.left",
  file: "doc.text",
  camera: "camera",
  check: "checkmark.circle",
};

/** The native pull-down menu behind a "+" in the navigation bar, like Notes. */
export function ActionMenu({ label, actions }: ActionMenuProps) {
  return (
    <Host matchContents>
      <Menu
        label={label}
        systemImage="plus"
        modifiers={[labelStyle("iconOnly"), tint(colors.ink)]}
      >
        {actions.map((action) => (
          <Button
            key={action.title}
            label={action.title}
            systemImage={symbols[action.icon]}
            onPress={action.onPress}
          />
        ))}
      </Menu>
    </Host>
  );
}
