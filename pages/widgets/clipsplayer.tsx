import { useState, useEffect } from "react";
import { useRouter } from "next/router";

interface Clip {
  id: string;
  url: string;
  embed_url: string;
  title: string;
  duration: number;
  creator_name: string;
  view_count: number;
}

interface ClipsConfig {
  channel: string;
  mode: "random" | "top";
  range: "all" | "7d" | "30d" | "6m" | "1y";
  length: number;
  volume: number;
  overlay: boolean;
  timer: boolean;
  category: boolean;
}

export default function ClipsPlayer() {
  const router = useRouter();
  const [clips, setClips] = useState<Clip[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [config, setConfig] = useState<ClipsConfig | null>(null);

  // 解析 URL 參數
  useEffect(() => {
    if (!router.isReady) return;

    setConfig({
      channel: router.query.channel as string,
      mode: (router.query.mode as "random" | "top") || "random",
      range:
        (router.query.range as "all" | "7d" | "30d" | "6m" | "1y") || "all",
      length: parseInt(router.query.length as string) || 60,
      volume: parseInt(router.query.volume as string) || 50,
      overlay: router.query.overlay === "true",
      timer: router.query.timer === "true",
      category: router.query.category === "true",
    });
  }, [router.isReady, router.query]);

  // 獲取剪輯
  useEffect(() => {
    const fetchClips = async () => {
      if (!config?.channel) return;

      try {
        const tokenResponse = await fetch("/api/twitch/app-token");
        const { access_token } = await tokenResponse.json();

        // 獲取用戶 ID
        const userResponse = await fetch(
          `https://api.twitch.tv/helix/users?login=${config.channel}`,
          {
            headers: {
              "Client-ID": process.env.NEXT_PUBLIC_CLIENT_ID!,
              Authorization: `Bearer ${access_token}`,
            },
          }
        );

        const userData = await userResponse.json();
        if (!userData.data?.[0]?.id) return;

        // 構建 clips URL 並添加時間範圍
        let clipsUrl = `https://api.twitch.tv/helix/clips?broadcaster_id=${userData.data[0].id}&first=20`;

        if (config.range !== "all") {
          const startDate = new Date();
          switch (config.range) {
            case "7d":
              startDate.setDate(startDate.getDate() - 7);
              break;
            case "30d":
              startDate.setDate(startDate.getDate() - 30);
              break;
            case "6m":
              startDate.setMonth(startDate.getMonth() - 6);
              break;
            case "1y":
              startDate.setFullYear(startDate.getFullYear() - 1);
              break;
          }
          clipsUrl += `&started_at=${startDate.toISOString()}`;
        }

        const clipsResponse = await fetch(clipsUrl, {
          headers: {
            "Client-ID": process.env.NEXT_PUBLIC_CLIENT_ID!,
            Authorization: `Bearer ${access_token}`,
          },
        });

        let clipsData = await clipsResponse.json();

        // 根據設定處理剪輯
        let processedClips = clipsData.data;

        // 過濾長度
        processedClips = processedClips.filter(
          (clip: Clip) => clip.duration <= config.length
        );

        // 排序模式
        if (config.mode === "top") {
          processedClips.sort(
            (a: Clip, b: Clip) => b.view_count - a.view_count
          );
        } else {
          processedClips.sort(() => Math.random() - 0.5);
        }

        setClips(processedClips);
      } catch (error) {
        console.error("Error fetching clips:", error);
      }
    };

    if (config) {
      fetchClips();
    }
  }, [config]);

  // 初始化播放器
  useEffect(() => {
    if (!clips.length) return;

    const clip = clips[currentIndex];
    const clipSlug = clip.url.split("/").pop();

    try {
      const container = document.getElementById("player");
      if (container) {
        container.innerHTML = `
          <iframe
            src="https://clips.twitch.tv/embed?clip=${clipSlug}&parent=${
          window.location.hostname
        }&autoplay=true&muted=false&volume=${config?.volume || 50}"
            width="100%"
            height="100%"
            allowfullscreen="true"
            allow="autoplay"
          ></iframe>
        `;
      }
    } catch (error) {
      console.error("Error initializing player:", error);
    }
  }, [currentIndex, clips, config?.volume]);

  // 自動播放邏輯
  useEffect(() => {
    if (clips.length === 0) return;

    const currentClip = clips[currentIndex];
    const duration = Math.ceil(currentClip.duration * 1000);

    const timer = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % clips.length);
    }, duration);

    return () => clearTimeout(timer);
  }, [currentIndex, clips]);

  if (!config?.channel || clips.length === 0) {
    return null;
  }

  return (
    <div className="w-full h-screen bg-black">
      <div id="player" className="w-full h-full" />
      {config.overlay && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-white">
          <h3 className="text-lg font-bold">{clips[currentIndex].title}</h3>
          <p className="text-sm">
            由 {clips[currentIndex].creator_name} 建立
            {config.timer && (
              <span className="ml-2">
                • {Math.round(clips[currentIndex].duration)}秒
              </span>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
