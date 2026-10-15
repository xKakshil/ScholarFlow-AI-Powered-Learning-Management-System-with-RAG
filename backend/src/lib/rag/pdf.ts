import { extractText } from "unpdf";

const MAX_PDF_BYTES = 15 * 1024 * 1024; // 15 MB
const FETCH_TIMEOUT_MS = 20_000;

// Google Drive share links return an HTML page; use the direct download URL.
function toDownloadUrl(url: string) {
  const drive = url.match(/drive\.google\.com\/file\/d\/([\w-]+)/);
  if (drive) return `https://drive.google.com/uc?export=download&id=${drive[1]}`;
  return url;
}

export async function fetchPdfText(rawUrl: string): Promise<string[]> {
  let url: URL;
  try {
    url = new URL(toDownloadUrl(rawUrl.trim()));
  } catch {
    throw new Error("PDF URL is not a valid URL");
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("PDF URL must be http(s)");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal, redirect: "follow" });
    if (!res.ok) throw new Error(`PDF download failed (HTTP ${res.status})`);

    const declared = Number(res.headers.get("content-length") || 0);
    if (declared > MAX_PDF_BYTES) throw new Error("PDF is larger than 15 MB");

    const buf = new Uint8Array(await res.arrayBuffer());
    if (buf.byteLength > MAX_PDF_BYTES) throw new Error("PDF is larger than 15 MB");
    // Reject non-PDF responses such as sign-in pages.
    if (!(buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46)) {
      throw new Error("URL did not return a PDF file (is it publicly accessible?)");
    }

    const { text } = await extractText(buf, { mergePages: false });
    return text;
  } catch (e) {
    if ((e as Error).name === "AbortError") throw new Error("PDF download timed out");
    throw e;
  } finally {
    clearTimeout(timer);
  }
}
