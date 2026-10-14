import type { ColorValue } from "react-native";
import Svg, { Path, Circle, Rect } from "react-native-svg";
import { colors } from "./theme";
export type IconName =
  | "home"
  | "projects"
  | "book"
  | "user"
  | "arrow"
  | "back"
  | "plus"
  | "check"
  | "bell"
  | "camera"
  | "message"
  | "calendar"
  | "money"
  | "file"
  | "close"
  | "chevron"
  | "spark"
  | "tools"
  | "download"
  | "kitchen"
  | "bath"
  | "paint"
  | "floor"
  | "roof";
const paths: Partial<Record<IconName, string>> = {
  home: "M3 10L12 3l9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z",
  projects: "M3 7h7l2-3h8a1 1 0 0 1 1 1v15H3z",
  book: "M12 5c-3-2-6-2-9-1v16c3-1 6-1 9 1 3-2 6-2 9-1V4c-3-1-6-1-9 1v16",
  arrow: "M4 12h16m-6-6 6 6-6 6",
  back: "M20 12H4m6-6-6 6 6 6",
  plus: "M12 5v14M5 12h14",
  check: "m5 12 4 4L19 6",
  close: "m6 6 12 12M6 18 18 6",
  chevron: "m9 5 7 7-7 7",
  bell: "M5 17h14l-2-3V9a5 5 0 0 0-10 0v5zM10 21h4",
  camera: "M3 7h4l2-3h6l2 3h4v13H3z",
  message: "M4 4h16v13H9l-5 4z",
  calendar: "M4 6h16v15H4zM8 3v6M16 3v6M4 11h16",
  money: "M16 7h-6a3 3 0 0 0 0 6h4a3 3 0 0 1 0 6H7M12 3v18",
  file: "M5 3h9l5 5v13H5zM14 3v6h5M8 13h8M8 17h6",
  spark: "m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3z",
  tools: "m14 6 4 4-9 9-4-4zM14 6l1-3 6 6-3 1M5 15l-2 6 6-2",
  download: "M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5",
  kitchen:
    "M4 10h16v8a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3zM2 10h20M9 6V3M12 6V2M15 6V3",
  bath: "M3 12h18v3a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5zM6 12V5a2 2 0 0 1 4 0M7 20l-1 2M17 20l1 2",
  paint: "M4 3h13v5H4zM17 5h3v6h-8v3M11 14h2v7h-2z",
  floor: "M3 3h18v18H3zM3 9h18M3 15h18M9 3v6M15 9v6M9 15v6",
  roof: "M2 12 12 4l10 8M5 10v10h14V10M10 20v-5h4v5",
};
export function Icon({
  name,
  size = 24,
  color = colors.ink,
}: {
  name: IconName;
  size?: number;
  color?: ColorValue;
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {name === "user" ? (
        <>
          <Circle cx="12" cy="8" r="4" />
          <Path d="M4 21v-2a8 8 0 0 1 16 0v2" />
        </>
      ) : (
        <Path d={paths[name]} />
      )}
      {name === "camera" && <Circle cx="12" cy="13" r="3" />}
      {name === "projects" && (
        <Rect x="7" y="10" width="10" height="1" strokeWidth={0} fill={color} />
      )}
    </Svg>
  );
}
