import { Pressable, View } from "react-native";
import { Image } from "expo-image";
import { Member, Project, Role, dateLabel } from "@/domain/model";
import { GalleryPhoto } from "./photo-gallery";
import { Copy } from "./ui";
import { Icon } from "./icon";
import { colors, fonts } from "./theme";

type Event = Project["events"][number];

/** Photos posted in the thread, oldest first, for the full-screen viewer. */
export function threadPhotos(p: Project): GalleryPhoto[] {
  return [...p.events]
    .reverse()
    .flatMap((e) =>
      e.photo
        ? [{ id: e.photo.id, source: e.photo.uri, name: e.photo.name }]
        : [],
    );
}

/**
 * The shared record read as one conversation, oldest at the top. Updates are
 * messages from a person; decisions, payments and punch-list steps sit between
 * them as short centered notes.
 */
export function ProjectThread({
  p,
  members,
  role,
  onOpenPhoto,
}: {
  p: Project;
  members: Member[];
  role: Role;
  onOpenPhoto: (id: string) => void;
}) {
  // Events carry the author's name; membership says which side they're on.
  const me = members.find((m) => m.role === role)?.name;
  const roleOf = (author: string) =>
    members.find((m) => m.name === author)?.role;
  return (
    <View style={{ gap: 18 }}>
      {[...p.events]
        .reverse()
        .map((event) =>
          event.kind === "update" ? (
            <Message
              key={event.id}
              event={event}
              mine={event.author === me}
              role={roleOf(event.author)}
              onOpenPhoto={onOpenPhoto}
            />
          ) : (
            <SystemNote key={event.id} event={event} />
          ),
        )}
    </View>
  );
}

function Message({
  event,
  mine,
  role,
  onOpenPhoto,
}: {
  event: Event;
  mine: boolean;
  role?: Role;
  onOpenPhoto: (id: string) => void;
}) {
  const photo = event.photo;
  return (
    <View
      style={{
        gap: 5,
        maxWidth: "84%",
        alignSelf: mine ? "flex-end" : "flex-start",
        alignItems: mine ? "flex-end" : "flex-start",
      }}
    >
      <Copy tone="muted" style={{ fontSize: 12, paddingHorizontal: 4 }}>
        <Copy style={{ fontFamily: fonts.bold, fontSize: 12 }}>
          {mine ? "You" : event.author}
        </Copy>
        {!mine && role
          ? " · " + (role === "homeowner" ? "Homeowner" : "Contractor")
          : ""}
        {" · " + dateLabel(event.at)}
      </Copy>
      {photo && (
        <Pressable
          accessibilityRole="imagebutton"
          accessibilityLabel={"Open photo: " + photo.name}
          onPress={() => onOpenPhoto(photo.id)}
        >
          <Image
            source={photo.uri}
            accessibilityLabel={photo.name}
            style={{ width: 240, height: 180, borderRadius: 16 }}
            contentFit="cover"
          />
        </Pressable>
      )}
      {!!event.text && (
        <View
          style={{
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderRadius: 18,
            borderBottomRightRadius: mine ? 6 : 18,
            borderBottomLeftRadius: mine ? 18 : 6,
            backgroundColor: mine ? colors.ink : colors.white,
            borderWidth: mine ? 0 : 1,
            borderColor: colors.line,
          }}
        >
          <Copy style={mine ? { color: colors.white } : undefined}>
            {event.text}
          </Copy>
        </View>
      )}
    </View>
  );
}

function SystemNote({ event }: { event: Event }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        alignSelf: "center",
        maxWidth: "92%",
        gap: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        backgroundColor: colors.sage,
      }}
    >
      <View style={{ paddingTop: 2 }}>
        <Icon
          size={14}
          name={
            event.kind === "payment"
              ? "money"
              : event.kind === "change"
                ? "file"
                : event.kind === "punch"
                  ? "check"
                  : "home"
          }
        />
      </View>
      <Copy style={{ flexShrink: 1, fontSize: 13, lineHeight: 18 }}>
        <Copy style={{ fontFamily: fonts.bold, fontSize: 13 }}>
          {event.author}
        </Copy>{" "}
        {event.text}
        <Copy tone="muted" style={{ fontSize: 12 }}>
          {" · " + dateLabel(event.at)}
        </Copy>
      </Copy>
    </View>
  );
}
