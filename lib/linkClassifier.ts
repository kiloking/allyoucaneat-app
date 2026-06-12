export type LinkKind = "music" | "video" | "other";

export type LinkSource =
  | "youtube"
  | "suno"
  | "spotify"
  | "twitter"
  | "twitch-clip"
  | "web";

export interface ClassifiedLink {
  /** 去重用的唯一鍵(平台 + 媒體 id) */
  id: string;
  /** 原始連結 */
  url: string;
  kind: LinkKind;
  source: LinkSource;
  /** 可內嵌播放時的嵌入網址(twitch clip 需在執行期補 parent 參數) */
  embedUrl: string | null;
  /** 清單顯示用文字 */
  label: string;
}

const URL_REGEX = /https?:\/\/[^\s]+/g;

/** 從聊天訊息中取出所有連結(去除常見的結尾標點) */
export function extractUrls(message: string): string[] {
  const matches = message.match(URL_REGEX) ?? [];
  return matches.map((url) => url.replace(/[)\]}>,.!?;:、。!?]+$/, ""));
}

function shortLabel(parsed: URL): string {
  const host = parsed.hostname.replace(/^www\./, "");
  const path = parsed.pathname === "/" ? "" : parsed.pathname;
  const text = `${host}${path}`;
  return text.length > 50 ? `${text.slice(0, 47)}...` : text;
}

/** 判斷連結屬於哪個平台、能不能播、是音樂還是影片 */
export function classifyUrl(raw: string): ClassifiedLink | null {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return null;
  }

  const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
  const label = shortLabel(parsed);

  // YouTube(music.youtube.com 歸類為音樂)
  if (
    host === "youtube.com" ||
    host === "m.youtube.com" ||
    host === "music.youtube.com" ||
    host === "youtu.be"
  ) {
    let videoId = "";
    if (host === "youtu.be") {
      videoId = parsed.pathname.split("/")[1] ?? "";
    } else if (parsed.pathname === "/watch") {
      videoId = parsed.searchParams.get("v") ?? "";
    } else {
      const match = parsed.pathname.match(/^\/(shorts|live|embed)\/([\w-]+)/);
      videoId = match?.[2] ?? "";
    }
    if (videoId) {
      return {
        id: `youtube:${videoId}`,
        url: raw,
        kind: host === "music.youtube.com" ? "music" : "video",
        source: "youtube",
        embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1`,
        label,
      };
    }
  }

  // Suno
  if (host === "suno.com" || host === "app.suno.ai") {
    const match = parsed.pathname.match(/^\/song\/([\w-]+)/);
    if (match) {
      return {
        id: `suno:${match[1]}`,
        url: raw,
        kind: "music",
        source: "suno",
        embedUrl: `https://suno.com/embed/${match[1]}`,
        label,
      };
    }
  }

  // Spotify
  if (host === "open.spotify.com") {
    const match = parsed.pathname.match(
      /^\/(track|album|playlist|episode)\/([\w]+)/
    );
    if (match) {
      return {
        id: `spotify:${match[1]}:${match[2]}`,
        url: raw,
        kind: "music",
        source: "spotify",
        embedUrl: `https://open.spotify.com/embed/${match[1]}/${match[2]}`,
        label,
      };
    }
  }

  // X(Twitter)
  if (host === "x.com" || host === "twitter.com") {
    const match = parsed.pathname.match(/^\/[\w]+\/status\/(\d+)/);
    if (match) {
      return {
        id: `twitter:${match[1]}`,
        url: raw,
        kind: "video",
        source: "twitter",
        embedUrl: `https://platform.twitter.com/embed/Tweet.html?id=${match[1]}`,
        label,
      };
    }
  }

  // Twitch 剪輯
  if (host === "clips.twitch.tv" || host === "twitch.tv" || host === "m.twitch.tv") {
    let slug = "";
    if (host === "clips.twitch.tv") {
      slug = parsed.pathname.split("/")[1] ?? "";
    } else {
      const match = parsed.pathname.match(/^\/[\w]+\/clip\/([\w-]+)/);
      slug = match?.[1] ?? "";
    }
    if (slug) {
      return {
        id: `twitch-clip:${slug}`,
        url: raw,
        kind: "video",
        source: "twitch-clip",
        // parent 參數需在執行期依目前網域補上
        embedUrl: `https://clips.twitch.tv/embed?clip=${slug}&autoplay=true`,
        label,
      };
    }
  }

  // 其他一般網頁連結
  return {
    id: `web:${parsed.origin}${parsed.pathname}${parsed.search}`,
    url: raw,
    kind: "other",
    source: "web",
    embedUrl: null,
    label,
  };
}
