import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  HelpCircle,
  Link2,
  ListMusic,
  Monitor,
  Play,
  SkipForward,
  Trash2,
  X,
} from "lucide-react";
import {
  CollectedLink,
  useChatLinkCollector,
} from "@/hooks/useChatLinkCollector";
import { LinkSource } from "@/lib/linkClassifier";

type TabKey = "music" | "video" | "other";

const SOURCE_ICONS: Record<LinkSource, string> = {
  youtube: "▶️",
  suno: "🎶",
  spotify: "🎧",
  twitter: "🐦",
  "twitch-clip": "🎬",
  web: "🌐",
};

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: "music", label: "音樂" },
  { key: "video", label: "影片" },
  { key: "other", label: "一般連結" },
];

type AutoPlaySettings = { music: boolean; video: boolean };

const DEFAULT_AUTO_PLAY: AutoPlaySettings = { music: true, video: true };
const autoPlayStorageKey = (channel: string) =>
  `song-request:${channel}:autoplay`;

function loadAutoPlaySettings(channel: string): AutoPlaySettings {
  if (typeof window === "undefined") return DEFAULT_AUTO_PLAY;
  try {
    const saved = localStorage.getItem(autoPlayStorageKey(channel));
    if (!saved) return DEFAULT_AUTO_PLAY;
    const parsed = JSON.parse(saved) as Partial<AutoPlaySettings>;
    return {
      music: parsed.music ?? true,
      video: parsed.video ?? true,
    };
  } catch {
    return DEFAULT_AUTO_PLAY;
  }
}

export default function SongRequestRoom() {
  const router = useRouter();
  const channel =
    typeof router.query.channel === "string"
      ? router.query.channel.toLowerCase()
      : "";

  const { links, isConnected, removeLink, clearLinks } =
    useChatLinkCollector(channel);

  const [activeTab, setActiveTab] = useState<TabKey>("music");
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [playedIds, setPlayedIds] = useState<Set<string>>(new Set());
  const [theaterMode, setTheaterMode] = useState(false);
  const [autoPlayMusic, setAutoPlayMusic] = useState(true);
  const [autoPlayVideo, setAutoPlayVideo] = useState(true);
  const playerRef = useRef<HTMLIFrameElement | null>(null);
  // 頁面載入時已存在的連結不觸發自動播放,只對之後新收集的生效
  const seenLinkIdsRef = useRef<Set<string> | null>(null);

  // 可播放的佇列(音樂 + 影片,依收集順序)
  const queue = useMemo(
    () => links.filter((link) => link.kind !== "other"),
    [links]
  );
  const otherLinks = useMemo(
    () => links.filter((link) => link.kind === "other"),
    [links]
  );
  const current = queue.find((link) => link.id === currentId) ?? null;

  const play = useCallback((link: CollectedLink) => {
    setCurrentId(link.id);
    setPlayedIds((prev) => new Set(prev).add(link.id));
  }, []);

  // 載入此頻道的自動播放偏好(預設皆開啟)
  useEffect(() => {
    if (!channel) return;
    const settings = loadAutoPlaySettings(channel);
    setAutoPlayMusic(settings.music);
    setAutoPlayVideo(settings.video);
    seenLinkIdsRef.current = null;
  }, [channel]);

  useEffect(() => {
    if (!channel) return;
    localStorage.setItem(
      autoPlayStorageKey(channel),
      JSON.stringify({ music: autoPlayMusic, video: autoPlayVideo })
    );
  }, [channel, autoPlayMusic, autoPlayVideo]);

  const shouldAutoPlay = useCallback(
    (link: CollectedLink) =>
      (link.kind === "music" && autoPlayMusic) ||
      (link.kind === "video" && autoPlayVideo),
    [autoPlayMusic, autoPlayVideo]
  );

  // 新連結進佇列且播放器閒置時,依分類開關自動開始播放
  useEffect(() => {
    if (!channel || currentId) return;

    if (seenLinkIdsRef.current === null) {
      seenLinkIdsRef.current = new Set(links.map((link) => link.id));
      return;
    }

    const newLinks = links.filter((link) => !seenLinkIdsRef.current!.has(link.id));
    for (const link of newLinks) {
      seenLinkIdsRef.current!.add(link.id);
    }
    if (newLinks.length === 0) return;

    const toPlay = newLinks.find((link) => shouldAutoPlay(link));
    if (toPlay) play(toPlay);
  }, [links, currentId, channel, play, shouldAutoPlay]);

  const playNext = useCallback(() => {
    if (queue.length === 0) return;
    const index = queue.findIndex((link) => link.id === currentId);
    const next = queue
      .slice(index + 1)
      .find((link) => !playedIds.has(link.id));
    if (next) {
      play(next);
    } else {
      toast.info("佇列裡沒有下一個未播放的項目了");
    }
  }, [queue, currentId, playedIds, play]);

  // YouTube 播放結束自動跳下一個(透過 iframe API 的 postMessage 事件)
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (!event.origin.includes("youtube.com")) return;
      if (typeof event.data !== "string") return;
      try {
        const data = JSON.parse(event.data);
        const ended =
          (data.event === "onStateChange" && data.info === 0) ||
          (data.event === "infoDelivery" && data.info?.playerState === 0);
        if (ended) playNext();
      } catch {
        // 不是 JSON 的訊息直接略過
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [playNext]);

  // 通知 YouTube iframe 開始回報播放狀態
  const handlePlayerLoad = useCallback(() => {
    if (current?.source !== "youtube") return;
    const target = playerRef.current?.contentWindow;
    if (!target) return;
    target.postMessage(
      JSON.stringify({ event: "listening", id: "song-request-player" }),
      "*"
    );
  }, [current]);

  // twitch clip 的嵌入需要 parent 參數
  const embedSrc = useMemo(() => {
    if (!current?.embedUrl) return null;
    if (current.source === "twitch-clip") {
      return `${current.embedUrl}&parent=${window.location.hostname}`;
    }
    return current.embedUrl;
  }, [current]);

  const handleClear = () => {
    clearLinks();
    setCurrentId(null);
    setPlayedIds(new Set());
    toast.success("已清空所有收集的連結");
  };

  const tabLinks =
    activeTab === "music"
      ? queue.filter((link) => link.kind === "music")
      : activeTab === "video"
        ? queue.filter((link) => link.kind === "video")
        : otherLinks;

  const tabCount = (key: TabKey) =>
    key === "other"
      ? otherLinks.length
      : queue.filter((link) => link.kind === key).length;

  if (!channel) return null;

  return (
    <>
      <Head>
        <title>{`${channel} 的點歌頁面 - 圖奇喵直播助理`}</title>
      </Head>
      <div className="min-h-screen bg-neutral-950 text-white">
        <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">
          {/* 頂部狀態列 */}
          <header className="flex flex-wrap items-center gap-3">
            <h1 className="text-lg font-bold flex items-center gap-2">
              <ListMusic className="w-5 h-5 text-purple-400" />
              {channel} 的點歌頁面
            </h1>
            <span
              className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full ${
                isConnected
                  ? "bg-green-500/20 text-green-400"
                  : "bg-yellow-500/20 text-yellow-400"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isConnected ? "bg-green-400" : "bg-yellow-400 animate-pulse"
                }`}
              />
              {isConnected ? "聊天室已連線" : "連線中..."}
            </span>
            <div className="flex-1" />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-neutral-400 flex items-center gap-1 text-xs cursor-help">
                    <HelpCircle className="w-4 h-4" /> OBS 使用方式
                  </span>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  在 OBS 新增「視窗擷取」選擇此瀏覽器視窗,或開啟劇院模式後擷取,
                  即可和觀眾一起觀賞。
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Button
              size="sm"
              variant="outline"
              className="border-neutral-700 bg-transparent text-white hover:bg-neutral-800 hover:text-white"
              onClick={() => setTheaterMode((prev) => !prev)}
            >
              <Monitor className="w-4 h-4 mr-1" />
              {theaterMode ? "離開劇院模式" : "劇院模式"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-neutral-700 bg-transparent text-red-400 hover:bg-red-950 hover:text-red-300"
              onClick={handleClear}
            >
              <Trash2 className="w-4 h-4 mr-1" /> 清空
            </Button>
          </header>

          <div
            className={`grid gap-4 ${theaterMode ? "" : "lg:grid-cols-[2fr,1fr]"}`}
          >
            {/* 播放器 */}
            <section className="space-y-3">
              <div className="aspect-video bg-black rounded-xl overflow-hidden border border-neutral-800">
                {embedSrc ? (
                  <iframe
                    ref={playerRef}
                    key={current!.id}
                    src={embedSrc}
                    onLoad={handlePlayerLoad}
                    className="w-full h-full"
                    allow="autoplay; encrypted-media; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-neutral-500 gap-2">
                    <Play className="w-10 h-10" />
                    <p className="text-sm text-center px-4">
                      {queue.length > 0
                        ? autoPlayMusic || autoPlayVideo
                          ? "等待新連結自動播放,或從右側清單手動點選"
                          : "從右側清單點選項目開始播放"
                        : "等待觀眾在聊天室貼上連結..."}
                    </p>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                {current && (
                  <p className="text-sm text-neutral-300 truncate flex-1">
                    {SOURCE_ICONS[current.source]} {current.label}
                    <span className="text-neutral-500 ml-2">
                      由 {current.submittedBy} 點播
                    </span>
                  </p>
                )}
                <div className="flex-1" />
                <Button
                  size="sm"
                  onClick={playNext}
                  disabled={queue.length === 0}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <SkipForward className="w-4 h-4 mr-1" /> 下一個
                </Button>
              </div>
            </section>

            {/* 收集清單 */}
            {!theaterMode && (
              <section className="bg-neutral-900 rounded-xl border border-neutral-800 flex flex-col max-h-[calc(100vh-160px)]">
                <div className="flex border-b border-neutral-800">
                  {TABS.map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`flex-1 py-2.5 text-sm transition-colors ${
                        activeTab === tab.key
                          ? "text-purple-400 border-b-2 border-purple-400 font-medium"
                          : "text-neutral-400 hover:text-white"
                      }`}
                    >
                      {tab.label} ({tabCount(tab.key)})
                    </button>
                  ))}
                </div>

                {(activeTab === "music" || activeTab === "video") && (
                  <div className="flex items-center justify-between px-3 py-2.5 border-b border-neutral-800 bg-neutral-900/80">
                    <span className="text-xs text-neutral-400">
                      {activeTab === "music" ? "音樂" : "影片"}自動播放
                    </span>
                    <Switch
                      checked={
                        activeTab === "music" ? autoPlayMusic : autoPlayVideo
                      }
                      onCheckedChange={(checked) =>
                        activeTab === "music"
                          ? setAutoPlayMusic(checked)
                          : setAutoPlayVideo(checked)
                      }
                      className="data-[state=checked]:bg-purple-600"
                    />
                  </div>
                )}

                <div className="overflow-y-auto flex-1 divide-y divide-neutral-800">
                  {tabLinks.length === 0 && (
                    <p className="text-sm text-neutral-500 text-center py-10 px-4">
                      還沒有收集到{TABS.find((t) => t.key === activeTab)?.label}
                      ,請觀眾在聊天室直接貼上連結即可
                    </p>
                  )}
                  {tabLinks.map((link) => {
                    const isCurrent = link.id === currentId;
                    const isPlayed = playedIds.has(link.id);
                    return (
                      <div
                        key={link.id}
                        className={`flex items-center gap-2 px-3 py-2.5 text-sm ${
                          isCurrent
                            ? "bg-purple-500/10"
                            : isPlayed
                              ? "opacity-50"
                              : ""
                        }`}
                      >
                        <span>{SOURCE_ICONS[link.source]}</span>
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-neutral-200">
                            {link.label}
                          </p>
                          <p className="text-xs text-neutral-500">
                            {link.submittedBy} ·{" "}
                            {new Date(link.timestamp).toLocaleTimeString(
                              "zh-TW",
                              { hour: "2-digit", minute: "2-digit" }
                            )}
                            {isPlayed && !isCurrent && " · 已播放"}
                            {isCurrent && " · 播放中"}
                          </p>
                        </div>
                        {link.kind === "other" ? (
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-neutral-400 hover:text-purple-400 p-1"
                            title="開啟連結"
                          >
                            <Link2 className="w-4 h-4" />
                          </a>
                        ) : (
                          <button
                            onClick={() => play(link)}
                            className="text-neutral-400 hover:text-purple-400 p-1"
                            title="播放"
                          >
                            <Play className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            removeLink(link.id);
                            if (isCurrent) setCurrentId(null);
                          }}
                          className="text-neutral-500 hover:text-red-400 p-1"
                          title="移除"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
