import { Post, Info, Stream, EpisodeLink, StreamType, ContentType, StreamQuality } from "./types";

const VALID_STREAM_TYPES: StreamType[] = ["mp4", "mkv", "m3u8"];
const VALID_CONTENT_TYPES: ContentType[] = ["movie", "series"];
const VALID_QUALITIES: StreamQuality[] = ["360", "480", "720", "1080", "2160"];

/** Normalize stream type - maps common aliases to standard values */
function normalizeStreamType(type: string): StreamType {
  const t = (type || "").toLowerCase().trim();
  if (t === "hls") return "m3u8";
  if (t === "DOWNLOAD_GENERATE") return "mkv";
  if (VALID_STREAM_TYPES.includes(t as StreamType)) return t as StreamType;
  // Infer from common patterns
  if (t.includes("m3u8") || t.includes("hls")) return "m3u8";
  if (t.includes("mp4")) return "mp4";
  return "mkv"; // default fallback
}

/** Normalize content type - ensures strict "movie" | "series" */
function normalizeContentType(type: string): ContentType {
  const t = (type || "").toLowerCase().trim();
  if (t === "series" || t === "tv" || t === "show" || t === "episode") return "series";
  if (VALID_CONTENT_TYPES.includes(t as ContentType)) return t as ContentType;
  return "movie"; // default fallback
}

/** Normalize quality value */
function normalizeQuality(quality?: string): StreamQuality | undefined {
  if (!quality) return undefined;
  const q = quality.replace(/p$/i, "").trim();
  if (VALID_QUALITIES.includes(q as StreamQuality)) return q as StreamQuality;
  // Try to extract numeric quality
  const match = q.match(/(\d+)/);
  if (match && VALID_QUALITIES.includes(match[1] as StreamQuality)) {
    return match[1] as StreamQuality;
  }
  return undefined;
}

/** Strip HTML tags from text */
function stripHtml(text: string): string {
  if (!text) return "";
  return text
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/** Normalize rating to numeric-only format */
function normalizeRating(rating?: string): string | undefined {
  if (!rating) return undefined;
  const match = rating.match(/([\d.]+)/);
  return match ? match[1] : undefined;
}

/** Normalize a single Post object */
export function normalizePost(post: any): Post {
  return {
    title: (post?.title || "").trim(),
    link: (post?.link || "").trim(),
    image: (post?.image || "").trim(),
    ...(post?.provider ? { provider: post.provider } : {}),
  };
}

/** Normalize an array of Posts */
export function normalizePosts(posts: any[]): Post[] {
  if (!Array.isArray(posts)) return [];
  return posts
    .map(normalizePost)
    .filter(p => p.title && p.link);
}

/** Normalize a single Stream object */
export function normalizeStream(stream: any): Stream {
  return {
    server: (stream?.server || "Unknown").trim(),
    link: (stream?.link || "").trim(),
    type: normalizeStreamType(stream?.type || ""),
    ...(stream?.quality ? { quality: normalizeQuality(stream.quality) } : {}),
    ...(stream?.subtitles?.length ? { subtitles: stream.subtitles } : {}),
    ...(stream?.headers && Object.keys(stream.headers).length > 0
      ? { headers: stream.headers }
      : {}),
  };
}

/** Normalize an array of Streams */
export function normalizeStreams(streams: any[]): Stream[] {
  if (!Array.isArray(streams)) return [];
  return streams
    .map(normalizeStream)
    .filter(s => s.link);
}

/** Normalize an Info/Meta object */
export function normalizeInfo(info: any): Info {
  return {
    title: (info?.title || "").trim(),
    image: (info?.image || "").trim(),
    synopsis: stripHtml(info?.synopsis || ""),
    imdbId: (info?.imdbId || "").trim(),
    type: normalizeContentType(info?.type || ""),
    ...(info?.tags?.length ? { tags: info.tags } : {}),
    ...(info?.cast?.length ? { cast: info.cast } : {}),
    ...(info?.rating ? { rating: normalizeRating(info.rating) } : {}),
    linkList: Array.isArray(info?.linkList) ? info.linkList.map((link: any) => ({
      title: (link?.title || "").trim(),
      ...(link?.quality ? { quality: link.quality } : {}),
      ...(link?.episodesLink ? { episodesLink: link.episodesLink } : {}),
      ...(link?.directLinks?.length
        ? {
            directLinks: link.directLinks.map((dl: any) => ({
              title: (dl?.title || "").trim(),
              link: (dl?.link || "").trim(),
              ...(dl?.type ? { type: normalizeContentType(dl.type) } : {}),
            })),
          }
        : {}),
    })) : [],
  };
}

/** Normalize a single EpisodeLink */
export function normalizeEpisodeLink(ep: any): EpisodeLink {
  return {
    title: (ep?.title || "").trim(),
    link: (ep?.link || "").trim(),
  };
}

/** Normalize an array of EpisodeLinks */
export function normalizeEpisodeLinks(eps: any[]): EpisodeLink[] {
  if (!Array.isArray(eps)) return [];
  return eps
    .map(normalizeEpisodeLink)
    .filter(e => e.title && e.link);
}
