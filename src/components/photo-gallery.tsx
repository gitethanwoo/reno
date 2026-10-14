import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { Image } from "expo-image";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Project } from "@/domain/model";
import { kitchen } from "./project-card";
import { Copy } from "./ui";
import { Icon } from "./icon";
import { colors, fonts } from "./theme";

export type GalleryPhoto = {
  id: string;
  source: string | number;
  name: string;
};

/** A project's photos; the sample shows its inspiration shot until it has its own. */
export function galleryPhotos(p: Project): GalleryPhoto[] {
  if (p.photos.length)
    return p.photos.map((photo) => ({
      id: photo.id,
      source: photo.uri,
      name: photo.name,
    }));
  return p.isSample
    ? [{ id: "sample", source: kitchen, name: "Sage tile kitchen inspiration" }]
    : [];
}

const HEIGHT = 195;
const GAP = 10;
const ADD_WIDTH = 116;
// Screen content padding, maximum width and gutter (see Screen in ui.tsx).
const PAD = 24;
const MAX = 660;

/**
 * Horizontal strip of project photos that bleeds to the screen edge, with an
 * optional "Add photos" tile at the end. Tapping a photo calls `onOpen`.
 */
export function PhotoStrip({
  photos: saved,
  onOpen,
  add,
  uploading = [],
}: {
  photos: GalleryPhoto[];
  onOpen: (index: number) => void;
  add?: { onPress: () => void; busy: boolean; left: number };
  /** Photos shown from the phone while they upload, after the saved ones. */
  uploading?: GalleryPhoto[];
}) {
  const window = useWindowDimensions();
  const content = Math.min(window.width, MAX) - PAD * 2;
  const photos = [...saved, ...uploading];
  if (!photos.length) return add ? <EmptyAdd {...add} /> : null;
  const width =
    photos.length === 1
      ? content - (add ? ADD_WIDTH + GAP : 0)
      : Math.round(content * 0.8);
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      decelerationRate="fast"
      snapToInterval={width + GAP}
      snapToAlignment="start"
      style={{ marginHorizontal: -PAD, flexGrow: 0 }}
      contentContainerStyle={{ paddingHorizontal: PAD, gap: GAP }}
    >
      {photos.map((photo, i) => (
        <Pressable
          key={photo.id}
          accessibilityRole="imagebutton"
          accessibilityLabel={
            photo.name + ", photo " + (i + 1) + " of " + photos.length
          }
          disabled={i >= saved.length}
          onPress={() => onOpen(i)}
        >
          <Image
            source={photo.source}
            recyclingKey={photo.id}
            transition={150}
            contentFit="cover"
            style={{
              width,
              height: HEIGHT,
              borderRadius: 14,
              backgroundColor: colors.sage,
            }}
          />
          {i >= saved.length && <Uploading radius={14} />}
          {i === 0 && photos.length > 1 && (
            <View
              style={{
                position: "absolute",
                left: 10,
                bottom: 10,
                paddingHorizontal: 9,
                paddingVertical: 4,
                borderRadius: 999,
                backgroundColor: "rgba(23, 51, 47, 0.78)",
              }}
            >
              <Text
                style={{
                  color: colors.white,
                  fontFamily: fonts.medium,
                  fontSize: 12,
                }}
              >
                {photos.length} photos
              </Text>
            </View>
          )}
        </Pressable>
      ))}
      {add && add.left > 0 && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add photos"
          accessibilityState={{ busy: add.busy }}
          disabled={add.busy}
          onPress={add.onPress}
          style={({ pressed }) => ({
            width: ADD_WIDTH,
            height: HEIGHT,
            borderRadius: 14,
            borderWidth: 1.5,
            borderStyle: "dashed",
            borderColor: colors.line,
            backgroundColor: pressed ? colors.sage : colors.white,
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: 10,
          })}
        >
          {add.busy ? (
            <ActivityIndicator color={colors.ink} />
          ) : (
            <Icon name="camera" />
          )}
          <Copy
            style={{ fontFamily: fonts.medium, fontSize: 14, lineHeight: 18 }}
          >
            Add photos
          </Copy>
          <Copy tone="muted" style={{ fontSize: 12, lineHeight: 16 }}>
            {add.left} left
          </Copy>
        </Pressable>
      )}
    </ScrollView>
  );
}

function EmptyAdd({ onPress, busy }: { onPress: () => void; busy: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Add photos of the space"
      accessibilityState={{ busy }}
      disabled={busy}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        padding: 18,
        borderRadius: 14,
        borderWidth: 1.5,
        borderStyle: "dashed",
        borderColor: colors.line,
        backgroundColor: pressed ? colors.sage : colors.white,
      })}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: colors.sage,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {busy ? (
          <ActivityIndicator color={colors.ink} />
        ) : (
          <Icon name="camera" />
        )}
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Copy style={{ fontFamily: fonts.medium }}>
          Add photos of the space
        </Copy>
        <Copy tone="muted" style={{ fontSize: 13, lineHeight: 18 }}>
          Before shots and details help everyone quote and plan from the same
          picture.
        </Copy>
      </View>
    </Pressable>
  );
}

/**
 * Full-screen viewer: swipe between photos, pinch to zoom (iOS scroll view
 * zoom). Shown while `index` is set.
 */
export function PhotoViewer({
  photos,
  index,
  onClose,
}: {
  photos: GalleryPhoto[];
  index: number | null;
  onClose: () => void;
}) {
  return (
    <Modal
      visible={index !== null}
      animationType="fade"
      presentationStyle="overFullScreen"
      transparent
      onRequestClose={onClose}
    >
      {index !== null && (
        <ViewerPages photos={photos} start={index} onClose={onClose} />
      )}
    </Modal>
  );
}

function ViewerPages({
  photos,
  start,
  onClose,
}: {
  photos: GalleryPhoto[];
  start: number;
  onClose: () => void;
}) {
  const { width, height } = useWindowDimensions();
  const inset = useSafeAreaInsets();
  const [current, setCurrent] = useState(start);
  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <StatusBar style="light" />
      <FlatList
        data={photos}
        keyExtractor={(photo) => photo.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={start}
        getItemLayout={(_, i) => ({
          length: width,
          offset: width * i,
          index: i,
        })}
        scrollEventThrottle={16}
        onScroll={(e) => {
          const next = Math.round(e.nativeEvent.contentOffset.x / width);
          if (next !== current && next >= 0 && next < photos.length)
            setCurrent(next);
        }}
        renderItem={({ item }) => (
          <ScrollView
            style={{ width, height }}
            contentContainerStyle={{ width, height }}
            maximumZoomScale={4}
            minimumZoomScale={1}
            centerContent
            bouncesZoom
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
          >
            <Image
              source={item.source}
              contentFit="contain"
              accessibilityLabel={item.name}
              style={{ width, height }}
            />
          </ScrollView>
        )}
      />
      <View
        pointerEvents="box-none"
        style={{
          position: "absolute",
          top: inset.top + 6,
          left: 12,
          right: 12,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close photos"
          hitSlop={8}
          onPress={onClose}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(255, 255, 255, 0.16)",
          }}
        >
          <Icon name="close" size={20} color={colors.white} />
        </Pressable>
        {photos.length > 1 && (
          <Text
            accessibilityLiveRegion="polite"
            style={{
              color: colors.white,
              fontFamily: fonts.medium,
              fontSize: 15,
            }}
          >
            {current + 1} of {photos.length}
          </Text>
        )}
        <View style={{ width: 40 }} />
      </View>
    </View>
  );
}

/** Dims a photo that's shown from the phone while it uploads. */
export function Uploading({ radius = 10 }: { radius?: number }) {
  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: radius,
        backgroundColor: "rgba(23, 51, 47, 0.45)",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <ActivityIndicator color={colors.white} accessibilityLabel="Uploading" />
    </View>
  );
}
