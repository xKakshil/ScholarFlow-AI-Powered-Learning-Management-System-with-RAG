export function toEmbedUrl(raw: string): string {
  const url = raw.trim();
  const yt =
    url.match(/youtube\.com\/watch\?[^#]*v=([\w-]{11})/) ||
    url.match(/youtu\.be\/([\w-]{11})/) ||
    url.match(/youtube\.com\/(?:shorts|live|embed)\/([\w-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}?playsinline=1&rel=0`;

  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo && !url.includes("player.vimeo.com")) return `https://player.vimeo.com/video/${vimeo[1]}`;

  return url;
}

export function isDirectVideoFile(url: string) {
  return /\.(mp4|webm|m3u8|mov)(\?|$)/i.test(url);
}
