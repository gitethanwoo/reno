import { useRef, useState } from "react";
import { Modal, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Copy, IconButton } from "./ui";
import { Icon, IconName } from "./icon";
import { colors, fonts } from "./theme";

export type MenuAction = { title: string; icon: IconName; onPress: () => void };

export type ActionMenuProps = { label: string; actions: MenuAction[] };

/**
 * Fallback for web and Android: a "+" that opens a sheet of actions from the
 * bottom. iOS uses the native pull-down menu.
 */
export function ActionMenu({ label, actions }: ActionMenuProps) {
  const [open, setOpen] = useState(false);
  const inset = useSafeAreaInsets();
  // The browser's modal hands focus back to "+" as it closes, which would
  // steal it from a field the action focuses; so on web, act after it closes.
  // (Android never calls onDismiss.)
  const chosen = useRef<MenuAction>(null);
  const choose = (action: MenuAction) => {
    setOpen(false);
    if (process.env.EXPO_OS === "web") chosen.current = action;
    else action.onPress();
  };
  return (
    <>
      <IconButton name="plus" label={label} onPress={() => setOpen(true)} />
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
        onDismiss={() => {
          chosen.current?.onPress();
          chosen.current = null;
        }}
      >
        <Pressable
          accessibilityLabel="Close menu"
          onPress={() => setOpen(false)}
          style={{
            flex: 1,
            justifyContent: "flex-end",
            backgroundColor: "rgba(23, 51, 47, 0.35)",
          }}
        >
          <View
            accessibilityRole="menu"
            style={{
              padding: 12,
              paddingBottom: Math.max(inset.bottom, 12),
              gap: 8,
              maxWidth: 504,
              width: "100%",
              alignSelf: "center",
            }}
          >
            <View
              style={{
                borderRadius: 16,
                backgroundColor: colors.white,
                overflow: "hidden",
              }}
            >
              {actions.map((action, i) => (
                <Pressable
                  key={action.title}
                  accessibilityRole="menuitem"
                  accessibilityLabel={action.title}
                  onPress={() => choose(action)}
                  style={({ pressed }) => ({
                    minHeight: 56,
                    paddingHorizontal: 18,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 14,
                    borderTopWidth: i ? 1 : 0,
                    borderTopColor: colors.line,
                    backgroundColor: pressed ? colors.sage : colors.white,
                  })}
                >
                  <Icon name={action.icon} size={20} />
                  <Copy style={{ fontFamily: fonts.medium }}>
                    {action.title}
                  </Copy>
                </Pressable>
              ))}
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => setOpen(false)}
              style={({ pressed }) => ({
                minHeight: 56,
                borderRadius: 16,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: pressed ? colors.sage : colors.white,
              })}
            >
              <Copy style={{ fontFamily: fonts.bold }}>Cancel</Copy>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}
