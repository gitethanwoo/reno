import { ActionSheetIOS, Alert, Linking } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { Directory, File, Paths } from "expo-file-system";
import { Photo } from "@/domain/model";
import { colors } from "@/components/theme";
import { uid } from "./id";

type Source = "camera" | "library";

/** Native "Take photo / Choose from library" sheet. Web has no camera flow. */
function chooseSource(): Promise<Source | null> {
  if (process.env.EXPO_OS === "web") return Promise.resolve("library");
  return new Promise((resolve) => {
    if (process.env.EXPO_OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Take Photo", "Choose from Library", "Cancel"],
          cancelButtonIndex: 2,
          tintColor: colors.ink,
        },
        (index) =>
          resolve(index === 0 ? "camera" : index === 1 ? "library" : null),
      );
      return;
    }
    Alert.alert(
      "Add photos",
      undefined,
      [
        { text: "Take photo", onPress: () => resolve("camera") },
        { text: "Choose from library", onPress: () => resolve("library") },
        { text: "Cancel", style: "cancel", onPress: () => resolve(null) },
      ],
      { cancelable: true, onDismiss: () => resolve(null) },
    );
  });
}

async function cameraAllowed() {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (permission.granted) return true;
  Alert.alert(
    "Camera access is off",
    "To take project photos, allow Reno to use the camera in Settings.",
    [
      { text: "Not now", style: "cancel" },
      { text: "Open Settings", onPress: () => void Linking.openSettings() },
    ],
  );
  return false;
}

/** Long edge for stored photos: sharp on a phone screen, a few hundred KB to upload. */
const LONG_EDGE = 2048;

/** A phone camera's full-size photo is several MB; shrink it before it's kept or uploaded. */
async function shrink(uri: string) {
  let image = await ImageManipulator.manipulate(uri).renderAsync();
  if (Math.max(image.width, image.height) > LONG_EDGE)
    image = await ImageManipulator.manipulate(image)
      .resize(
        image.width >= image.height
          ? { width: LONG_EDGE }
          : { height: LONG_EDGE },
      )
      .renderAsync();
  return (await image.saveAsync({ compress: 0.7, format: SaveFormat.JPEG }))
    .uri;
}

/** Keep a local copy so the photo survives the picker's temporary file. */
async function keep(asset: ImagePicker.ImagePickerAsset): Promise<Photo> {
  const id = uid();
  const shrunk = await shrink(asset.uri);
  let uri = shrunk;
  if (process.env.EXPO_OS !== "web") {
    const dir = new Directory(Paths.document, "project-photos");
    dir.create({ idempotent: true, intermediates: true });
    const file = new File(dir, id + ".jpg");
    await new File(shrunk).move(file);
    uri = file.uri;
  } else {
    const blob = await (await fetch(shrunk)).blob();
    uri = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
  return { id, uri, name: asset.fileName ?? "Project photo" };
}

/**
 * Ask for a camera shot or library pick. `max` is how many photos the caller
 * can still accept; 1 means a single pick.
 */
export async function pickPhotos(max: number): Promise<Photo[]> {
  if (max < 1) return [];
  const source = await chooseSource();
  if (!source) return [];
  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: ["images"],
    quality: 0.8,
  };
  let result: ImagePicker.ImagePickerResult;
  if (source === "camera") {
    if (!(await cameraAllowed())) return [];
    result = await ImagePicker.launchCameraAsync(options);
  } else {
    result = await ImagePicker.launchImageLibraryAsync({
      ...options,
      allowsMultipleSelection: max > 1,
      selectionLimit: max,
      orderedSelection: true,
    });
  }
  if (result.canceled) return [];
  return Promise.all(result.assets.slice(0, max).map(keep));
}

export async function photoUpload(photo: Photo) {
  const data =
    process.env.EXPO_OS === "web"
      ? await (await fetch(photo.uri)).arrayBuffer()
      : await new File(photo.uri).arrayBuffer();
  if (data.byteLength > 5 * 1024 * 1024)
    throw new Error("Choose a photo smaller than 5 MB.");
  const bytes = new Uint8Array(data);
  const contentType =
    bytes[0] === 0xff && bytes[1] === 0xd8
      ? "image/jpeg"
      : bytes[0] === 0x89 && bytes[1] === 0x50
        ? "image/png"
        : bytes[0] === 0x52 && bytes[8] === 0x57
          ? "image/webp"
          : "";
  if (!contentType) throw new Error("Choose a JPEG, PNG, or WebP photo.");
  return { data, contentType, name: photo.name };
}
