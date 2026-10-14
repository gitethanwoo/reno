import * as ImagePicker from "expo-image-picker";
import { Directory, File, Paths } from "expo-file-system";
import { Photo } from "@/domain/model";
import { uid } from "./id";
export async function pickPhoto(): Promise<Photo | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    quality: 0.8,
    allowsEditing: false,
  });
  if (result.canceled) return null;
  const asset = result.assets[0];
  const id = uid();
  let uri = asset.uri;
  if (process.env.EXPO_OS !== "web") {
    const dir = new Directory(Paths.document, "project-photos");
    dir.create({ idempotent: true, intermediates: true });
    const extension =
      (asset.fileName?.split(".").pop() ?? "jpg").replace(
        /[^a-zA-Z0-9]/g,
        "",
      ) || "jpg";
    const file = new File(dir, id + "." + extension);
    new File(asset.uri).copy(file);
    uri = file.uri;
  } else {
    const blob = await (await fetch(asset.uri)).blob();
    uri = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
  return { id, uri, name: asset.fileName ?? "Project photo" };
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
