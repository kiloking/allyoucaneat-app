declare global {
  interface Window {
    Twitch?: any;
  }
}

import { useState, useEffect, useRef } from "react";
import Head from "next/head";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface ClipsConfig {
  channelName: string;
  mode: "random" | "top";
  timeRange: "all" | "7d" | "30d" | "6m" | "1y";
  maxLength: number;
  volume: number;
  showOverlay: boolean;
  showTimer: boolean;
  preferCurrentCategory: boolean;
}

export default function ClipsManager() {
  const [config, setConfig] = useState<ClipsConfig>({
    channelName: "",
    mode: "random",
    timeRange: "7d",
    maxLength: 60,
    volume: 60,
    showOverlay: true,
    showTimer: false,
    preferCurrentCategory: false,
  });
  const [widgetUrl, setWidgetUrl] = useState("");
  const [previewClips, setPreviewClips] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const playerRef = useRef<any>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    let autoPlayTimer: NodeJS.Timeout;

    if (isAutoPlaying && previewClips.length > 0) {
      const currentClip = previewClips[currentPreviewIndex];
      const duration = Math.ceil(currentClip.duration * 1000); // 轉換為毫秒
      console.log("duration", duration);
      autoPlayTimer = setTimeout(() => {
        handleNextClip();
      }, duration);
    }

    return () => {
      if (autoPlayTimer) {
        clearTimeout(autoPlayTimer);
      }
    };
  }, [isAutoPlaying, currentPreviewIndex, previewClips]);

  // 初始化 Twitch Player
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://player.twitch.tv/js/embed/v1.js";
    script.async = true;

    script.onload = () => {
      if (previewClips.length > 0) {
        initTwitchPlayer();
      }
    };

    document.body.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  // 當片段改變時重新初始化播放器
  useEffect(() => {
    if (window.Twitch && previewClips.length > 0) {
      initTwitchPlayer();
    }
  }, [currentPreviewIndex, previewClips]);

  const initTwitchPlayer = () => {
    const clip = previewClips[currentPreviewIndex];
    if (!clip) return;

    const clipSlug = clip.url.split("/").pop();

    if (playerRef.current) {
      playerRef.current.destroy();
    }

    try {
      const container = document.getElementById("twitch-player");
      if (container) {
        container.innerHTML = `
          <iframe
            src="https://clips.twitch.tv/embed?clip=${clipSlug}&parent=${window.location.hostname}&autoplay=true&muted=false"
            width="100%"
            height="100%"
            allowfullscreen="true"
            allow="autoplay"
          ></iframe>
        `;
      }

      const iframe = container?.querySelector("iframe");
      if (iframe) {
        iframe.onload = () => {
          console.log("Clip loaded successfully");
          // 嘗試設置音量
          try {
            const player = iframe as any;
            if (player.setVolume) {
              player.setVolume(config.volume / 100);
            }
          } catch (error) {
            console.error("Error setting volume:", error);
          }
        };
      }
    } catch (error) {
      console.error("Error initializing player:", error);

      const container = document.getElementById("twitch-player");
      if (container) {
        container.innerHTML = `
          <iframe
            src="${clip.embed_url}&parent=${window.location.hostname}&autoplay=true&muted=false"
            width="100%"
            height="100%"
            allowfullscreen="true"
            allow="autoplay"
          ></iframe>
        `;
      }
    }
  };

  const handleNextClip = () => {
    setCurrentPreviewIndex((prev) =>
      prev < previewClips.length - 1 ? prev + 1 : 0
    );
  };

  const generateWidgetUrl = () => {
    if (!config.channelName) {
      alert("請輸入頻道名稱");
      return;
    }

    const params = new URLSearchParams({
      channel: config.channelName,
      mode: config.mode,
      range: config.timeRange,
      length: config.maxLength.toString(),
      volume: config.volume.toString(),
      overlay: config.showOverlay.toString(),
      timer: config.showTimer.toString(),
      category: config.preferCurrentCategory.toString(),
    });

    const url = `${
      window.location.origin
    }/widgets/clipsplayer?${params.toString()}`;
    setWidgetUrl(url);
  };

  const fetchPreviewClips = async () => {
    if (!config.channelName) {
      alert("請輸入頻道名稱");
      return;
    }

    setIsLoading(true);
    try {
      // 先獲取 App Access Token
      const tokenResponse = await fetch("/api/twitch/app-token");
      const { access_token } = await tokenResponse.json();

      // 使用頻道名稱獲取用戶 ID
      const userResponse = await fetch(
        `https://api.twitch.tv/helix/users?login=${config.channelName}`,
        {
          headers: {
            "Client-ID": process.env.NEXT_PUBLIC_CLIENT_ID!,
            Authorization: `Bearer ${access_token}`,
          },
        }
      );

      const userData = await userResponse.json();
      if (!userData.data?.[0]?.id) {
        throw new Error("找不到該頻道");
      }

      // 根據設定獲取剪輯
      let clipsUrl = `https://api.twitch.tv/helix/clips?broadcaster_id=${userData.data[0].id}&first=20`;

      // 添加時間範圍過濾
      if (config.timeRange !== "all") {
        const startDate = new Date();
        switch (config.timeRange) {
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

      const clipsData = await clipsResponse.json();

      // 根據播放模式處理剪輯
      let processedClips = clipsData.data;
      if (config.mode === "top") {
        // 按觀看次數排序
        processedClips = processedClips.sort(
          (a: any, b: any) => b.view_count - a.view_count
        );
      } else {
        // 隨機排序
        processedClips = processedClips.sort(() => Math.random() - 0.5);
      }

      // 過長度超過設定的剪輯
      processedClips = processedClips.filter(
        (clip: any) => clip.duration <= config.maxLength
      );

      setPreviewClips(processedClips);
      setShowPreview(true);
      setCurrentPreviewIndex(0);
    } catch (error) {
      console.error("Error:", error);
      alert("獲取剪輯片段時發生錯誤");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Clips 播放器設定 | TwitchMeow</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <h1 className="text-4xl font-bold text-gray-900">
                Clips 播放器設定
              </h1>
              <p className="text-gray-600">
                輸入您的 Twitch 頻道名稱，自訂播放設定，獲取可用於 OBS 的網址
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
              {/* 基本設定 */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">基本設定</h2>
                <div className="space-y-2">
                  <label className="text-sm font-medium">頻道名稱</label>
                  <Input
                    placeholder="輸入 Twitch 頻道名稱"
                    value={config.channelName}
                    onChange={(e) =>
                      setConfig({ ...config, channelName: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* 播放設定 */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">播放設定</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">播放模式</label>
                    <Select
                      value={config.mode}
                      onValueChange={(value: "random" | "top") =>
                        setConfig({ ...config, mode: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="random">隨機播放</SelectItem>
                        <SelectItem value="top">熱門片段</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">時間範圍</label>
                    <Select
                      value={config.timeRange}
                      onValueChange={(value: any) =>
                        setConfig({ ...config, timeRange: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7d">最近 7 天</SelectItem>
                        <SelectItem value="30d">最近 30 天</SelectItem>
                        <SelectItem value="6m">最近 6 個月</SelectItem>
                        <SelectItem value="1y">最近1年</SelectItem>
                        <SelectItem value="all">所有時間</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    最大片段長度 ({config.maxLength} 秒)
                  </label>
                  <Slider
                    value={[config.maxLength]}
                    min={5}
                    max={60}
                    step={5}
                    onValueChange={(value) =>
                      setConfig({ ...config, maxLength: value[0] })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    音量 ({config.volume}%)
                  </label>
                  <Slider
                    value={[config.volume]}
                    min={0}
                    max={100}
                    onValueChange={(value) =>
                      setConfig({ ...config, volume: value[0] })
                    }
                  />
                </div>
              </div>

              {/* 顯示設定 */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">顯示設定</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">顯示資訊</label>
                    <Switch
                      checked={config.showOverlay}
                      onCheckedChange={(checked) =>
                        setConfig({ ...config, showOverlay: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">顯示計時器</label>
                    <Switch
                      checked={config.showTimer}
                      onCheckedChange={(checked) =>
                        setConfig({ ...config, showTimer: checked })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* 預覽按鈕 */}
              <div className="pt-4 flex space-x-4">
                <Button
                  onClick={fetchPreviewClips}
                  className="flex-1"
                  size="lg"
                  disabled={isLoading}
                >
                  {isLoading ? "載入中..." : "預覽剪輯"}
                </Button>
                <Button
                  onClick={generateWidgetUrl}
                  className="flex-1"
                  size="lg"
                >
                  生成 Widget 網址
                </Button>
              </div>
              {widgetUrl && (
                <div className="pt-4 space-y-2">
                  <label className="text-sm font-medium">Widget 網址</label>
                  <div className="flex space-x-2">
                    <Input value={widgetUrl} readOnly />
                    <Button
                      onClick={() => {
                        navigator.clipboard
                          .writeText(widgetUrl)
                          .then(() => {
                            toast.success("已複製到剪貼簿");
                          })
                          .catch(() => {
                            toast.error("複製失敗", {
                              position: "bottom-right",
                            });
                          });
                      }}
                    >
                      複製
                    </Button>
                  </div>
                </div>
              )}

              {/* 預覽區域 */}
              {showPreview && previewClips.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">預覽剪輯</h2>
                  <div className="relative aspect-video w-full">
                    <div
                      id="twitch-player"
                      className="w-full h-full rounded-lg overflow-hidden"
                    />
                  </div>

                  {/* 控制區域保持不變 */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                      <Button
                        onClick={() => {
                          setCurrentPreviewIndex((prev) =>
                            prev > 0 ? prev - 1 : previewClips.length - 1
                          );
                        }}
                        variant="outline"
                      >
                        上一個
                      </Button>
                      <Button onClick={handleNextClip} variant="outline">
                        下一個
                      </Button>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">
                        {currentPreviewIndex + 1} / {previewClips.length}
                      </span>
                      <Button
                        onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                        variant={isAutoPlaying ? "default" : "outline"}
                        className={
                          isAutoPlaying ? "bg-purple-600 text-white" : ""
                        }
                      >
                        {isAutoPlaying ? "停止自動播放" : "自動播放"}
                      </Button>
                    </div>
                  </div>

                  {/* 剪輯資訊 */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium">
                      {previewClips[currentPreviewIndex].title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-2">
                      觀看次數：
                      {previewClips[
                        currentPreviewIndex
                      ].view_count.toLocaleString()}
                      <span className="mx-2">•</span>
                      建立者：{previewClips[currentPreviewIndex].creator_name}
                      <span className="mx-2">•</span>
                      長度：
                      {Math.round(previewClips[currentPreviewIndex].duration)}秒
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
