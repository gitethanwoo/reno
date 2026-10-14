import { router } from "expo-router";
import { Image } from "expo-image";
import { Pressable, View } from "react-native";
import {
  Project,
  contractorOf,
  money,
  roleIn,
  statusLabel,
  total,
} from "@/domain/model";
import { useStore } from "@/state/store";
import { Badge, Copy, Heading } from "./ui";
import { colors, fonts } from "./theme";
import { Icon } from "./icon";
export const kitchen = require("@/assets/brand/kitchen.png");
export function ProjectCard({ project: p }: { project: Project }) {
  const { state } = useStore();
  const planning = p.status === "planning";
  const contractor = contractorOf(p);
  const line =
    roleIn(p, state) === "contractor"
      ? "You’re the contractor" +
        (planning
          ? p.quotes.length
            ? " · Quote sent"
            : " · Waiting for your quote"
          : "")
      : (p.quote?.company ??
        (planning && p.quotes.length
          ? "Quote ready to review"
          : contractor
            ? contractor.name + " · Waiting for a quote"
            : "Scope saved · Ready when you are"));
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={"Open " + p.title}
      onPress={() =>
        router.push({ pathname: "/project/[id]", params: { id: p.id } })
      }
      style={({ pressed }) => ({
        backgroundColor: colors.white,
        borderRadius: 18,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: colors.line,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      {p.isSample || p.photos.length ? (
        <View>
          <Image
            source={p.photos[0]?.uri ?? kitchen}
            style={{ width: "100%", height: 190 }}
            contentFit="cover"
            accessibilityLabel={
              p.isSample ? "Sage tile kitchen inspiration" : p.photos[0].name
            }
          />
          <View style={{ position: "absolute", top: 16, left: 16 }}>
            <Badge>{statusLabel(p)}</Badge>
          </View>
        </View>
      ) : (
        <View
          style={{
            height: 110,
            backgroundColor: colors.sage,
            padding: 24,
            justifyContent: "space-between",
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <Icon name="home" size={40} />
          <Badge>{statusLabel(p)}</Badge>
        </View>
      )}
      <View style={{ padding: 20, gap: 10 }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 10,
          }}
        >
          <View style={{ flex: 1 }}>
            <Heading small>{p.title}</Heading>
          </View>
          <Icon name="arrow" />
        </View>
        <Copy tone="muted" style={{ fontSize: 13 }}>
          {line}
          {p.isSample ? " · Sample" : ""}
        </Copy>
        {p.quote && (
          <View
            style={{
              borderTopWidth: 1,
              borderTopColor: colors.line,
              paddingTop: 14,
              marginTop: 3,
              flexDirection: "row",
              justifyContent: "space-between",
            }}
          >
            <Copy tone="muted" style={{ fontSize: 13 }}>
              Approved budget
            </Copy>
            <Copy style={{ fontFamily: fonts.bold }}>{money(total(p))}</Copy>
          </View>
        )}
      </View>
    </Pressable>
  );
}
