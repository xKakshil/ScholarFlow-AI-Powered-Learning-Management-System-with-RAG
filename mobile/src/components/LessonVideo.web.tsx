import { createElement } from "react";
import { View } from "react-native";
import { isDirectVideoFile, toEmbedUrl } from "@/lib/video";

export function LessonVideo({ url, width }: { url: string; width: number }) {
  const height = (width * 9) / 16;
  const style = { border: 0, width: "100%", height: "100%", background: "#000" };
  return (
    <View style={{ width, height, backgroundColor: "#000" }}>
      {isDirectVideoFile(url)
        ? createElement("video", { src: url, controls: true, playsInline: true, style })
        : createElement("iframe", {
            src: toEmbedUrl(url),
            allow: "autoplay; encrypted-media; picture-in-picture; fullscreen",
            allowFullScreen: true,
            style,
          })}
    </View>
  );
}
