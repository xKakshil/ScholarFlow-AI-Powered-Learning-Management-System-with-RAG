import { useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import { WEB_URL } from "@/lib/config";
import { isDirectVideoFile, toEmbedUrl } from "@/lib/video";

function escapeAttr(s: string) {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

// YouTube rejects embeds without a referrer, so the player is wrapped in HTML with a baseUrl.
export function LessonVideo({ url, width }: { url: string; width: number }) {
  const [loading, setLoading] = useState(true);
  const height = (width * 9) / 16;
  const src = escapeAttr(isDirectVideoFile(url) ? url : toEmbedUrl(url));

  const player = isDirectVideoFile(url)
    ? `<video src="${src}" controls playsinline style="width:100%;height:100%;background:#000"></video>`
    : `<iframe src="${src}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen
         referrerpolicy="strict-origin-when-cross-origin" style="border:0;width:100%;height:100%"></iframe>`;

  const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">
    <style>html,body{margin:0;height:100%;background:#000;overflow:hidden}</style></head>
    <body>${player}</body></html>`;

  return (
    <View style={{ width, height, backgroundColor: "#000" }}>
      <WebView
        source={{ html, baseUrl: WEB_URL }}
        style={{ flex: 1, backgroundColor: "#000" }}
        allowsInlineMediaPlayback
        allowsFullscreenVideo
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        onLoadEnd={() => setLoading(false)}
      />
      {loading && (
        <View style={[StyleSheet.absoluteFill, styles.loader]} pointerEvents="none">
          <ActivityIndicator color="#fff" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  loader: { alignItems: "center", justifyContent: "center" },
});
