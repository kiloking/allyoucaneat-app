import { useState } from "react";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle, Loader2 } from "lucide-react";
import { useClipsForm } from "@/hooks/useClipsForm";
import { useTwitchPlayer } from "@/hooks/useTwitchPlayer";

export default function ClipsManager() {
  const [widgetUrl, setWidgetUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const { config, handleConfigChange } = useClipsForm();
  const {
    previewClips,
    setPreviewClips,
    currentPreviewIndex,
    setCurrentPreviewIndex,
    isAutoPlaying,
    setIsAutoPlaying,
    handleNextClip,
  } = useTwitchPlayer(config.volume);

  const generateWidgetUrl = () => {
    if (!config.channelName) {
      toast.error("請輸入頻道名稱");
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
    toast.success("Widget 網址已生成！");
  };

  const fetchPreviewClips = async () => {
    if (!config.channelName) {
      toast.error("請輸入頻道名稱");
      return;
    }

    setIsLoading(true);
    setShowPreview(false);
    setPreviewClips([]);

    try {
      const params = new URLSearchParams({
        channel: config.channelName,
        mode: config.mode,
        range: config.timeRange,
        length: config.maxLength.toString(),
      });

      const response = await fetch(`/api/twitch/clips?${params.toString()}`);
      const clips = await response.json();

      if (!response.ok) {
        throw new Error(clips.message || "獲取剪輯片段時發生錯誤");
      }

      if (clips.length === 0) {
        toast.info("找不到符合條件的剪輯片段");
        return;
      }

      setPreviewClips(clips);
      setShowPreview(true);
      setCurrentPreviewIndex(0);
      toast.success("成功獲取剪輯片段！");
    } catch (error: any) {
      console.error("Error fetching clips:", error);
      toast.error(error.message || "獲取剪輯片段時發生錯誤");
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
              <div className="flex items-center justify-center gap-2">
                <h1 className="text-4xl font-bold text-gray-900">
                  Clips 播放器設定
                </h1>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-5 w-5 text-gray-500" />
                    </TooltipTrigger>
                    <TooltipContent className="bg-gray-200 text-black">
                      <div className="flex flex-col gap-2 items-start">
                        <div>1.輸入頻道名稱。</div>
                        <div>2.調整播放設定。</div>
                        <div>3.按下生成Widget網址，複製網址</div>
                        <div>4.打開 OBS，新增瀏覽器，貼上 Widget 網址。</div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              <p className="text-gray-600">
                適用於輪播 BRB 剪輯片段，輸入您的 Twitch 頻道名稱，獲取可用於
                OBS 的網址。
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
              {/* 基本設定 */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">基本設定</h2>
                <div className="space-y-2">
                  <label className="text-sm font-medium">頻道名稱</label>
                  <Input
                    placeholder="e.g. dada6621"
                    value={config.channelName}
                    onChange={(e) =>
                      handleConfigChange("channelName", e.target.value)
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
                        handleConfigChange("mode", value)
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
                        handleConfigChange("timeRange", value)
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
                      handleConfigChange("maxLength", value[0])
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
                      handleConfigChange("volume", value[0])
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
                        handleConfigChange("showOverlay", checked)
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">顯示計時器</label>
                    <Switch
                      checked={config.showTimer}
                      onCheckedChange={(checked) =>
                        handleConfigChange("showTimer", checked)
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
                  {isLoading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> 載入中...</>
                  ) : (
                    "預覽剪輯"
                  )}
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
                        navigator.clipboard.writeText(widgetUrl).then(() => {
                          toast.success("已複製到剪貼簿");
                        }).catch(() => {
                          toast.error("複製失敗");
                        });
                      }}
                    >
                      複製
                    </Button>
                  </div>
                </div>
              )}

              {/* 預覽區域 */}
              {isLoading && (
                <div className="flex justify-center items-center aspect-video w-full">
                  <Loader2 className="h-16 w-16 text-purple-600 animate-spin" />
                </div>
              )}

              {showPreview && previewClips.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">預覽剪輯</h2>
                  <div className="relative aspect-video w-full">
                    <div
                      id="twitch-player"
                      className="w-full h-full rounded-lg overflow-hidden"
                    />
                  </div>

                  {/* 控制區域 */}
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
                        className={isAutoPlaying ? "bg-purple-600 text-white" : ""}
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
                      {previewClips[currentPreviewIndex].view_count.toLocaleString()}
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