import { isDirectVideoFile, toEmbedUrl } from "@/lib/video";

export function LessonVideo({ url, title }: { url: string; title: string }) {
  return (
    <div className="rounded-panel aspect-video w-full overflow-hidden bg-black">
      {isDirectVideoFile(url) ? (
        <video src={url} controls playsInline className="size-full" title={title} />
      ) : (
        <iframe
          src={toEmbedUrl(url)}
          title={title}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          className="size-full border-0"
        />
      )}
    </div>
  );
}
