import React, { useState, useEffect, useCallback } from "react";
import tmi from "tmi.js";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HelpCircle, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { useChannelSettings } from "@/hooks/useChannelSettings";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { ContentLayout } from "@/components/admin-panel/content-layout";

const SYSTEM_BOTS = ["Nightbot", "StreamElements", "Moobot", "Streamlabs"];

interface ChatMessage {
  id: string;
  displayName: string;
  message: string;
  color: string;
  timestamp: number;
}

const Chat = () => {
  const { channelName, setChannelName } = useChannelSettings();
  const [channelInput, setChannelInput] = useState(channelName);
  const [isConnected, setIsConnected] = useState(false);
  const [client, setClient] = useState<tmi.Client | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const {
    isEnabled: isSpeechEnabled,
    rate: speechRate,
    volume: speechVolume,
    pitch: speechPitch,
    selectedVoice,
    availableVoices,
    setIsEnabled: setIsSpeechEnabled,
    setRate: setSpeechRate,
    setVolume: setSpeechVolume,
    setPitch: setSpeechPitch,
    setSelectedVoice,
    speak,
    clearQueue: clearSpeechQueue,
  } = useSpeechSynthesis();

  // 確保只在客戶端渲染，避免 hydration 錯誤
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 同步頻道輸入與設定
  useEffect(() => {
    setChannelInput(channelName);
  }, [channelName]);

  // 連接到聊天室
  const connectToChat = useCallback(
    (channel: string) => {
      if (isConnected || !channel.trim()) return;

      const trimmedChannel = channel.trim();
      setChannelName(trimmedChannel);

      try {
        const newClient = new tmi.Client({
          channels: [trimmedChannel],
        });

        newClient
          .connect()
          .then(() => {
            setIsConnected(true);
            setClient(newClient);
            speak("聊天室已連結完成");
            toast.success(`已連接到 ${trimmedChannel}`);

            newClient.on("message", (channel, tags, message, self) => {
              const username = tags.username?.toLowerCase() || "";

              // 過濾系統機器人
              if (
                SYSTEM_BOTS.some((bot) => username.includes(bot.toLowerCase()))
              ) {
                return;
              }

              const displayName =
                tags["display-name"] || tags.username || "未知用戶";
              const userColor = tags.color || "#8A2BE2";

              // 處理語音訊息 - 過濾連結
              let speechMessage = message;
              if (message.includes("https://") || message.includes("http://")) {
                speechMessage = "連結懶得念";
              }

              // 新增訊息
              const newMessage: ChatMessage = {
                id: `${Date.now()}-${Math.random()}`,
                displayName,
                message,
                color: userColor,
                timestamp: Date.now(),
              };

              setMessages((prev) => [...prev, newMessage]);

              // 播放語音
              speak(speechMessage);
            });
          })
          .catch((err) => {
            console.error("連接失敗:", err);
            toast.error("連接失敗，請檢查頻道名稱是否正確");
          });
      } catch (err) {
        console.error("建立連接時發生錯誤:", err);
        toast.error("建立連接時發生錯誤");
      }
    },
    [isConnected, setChannelName, speak]
  );

  // 斷開連接
  const disconnectFromChat = useCallback(() => {
    if (client) {
      client.disconnect();
      setClient(null);
      setIsConnected(false);
      setMessages([]);
      clearSpeechQueue();
      speak("已斷開連接");
      toast.info("已斷開連接");
    }
  }, [client, clearSpeechQueue, speak]);

  return (
    <DashboardLayout>
      <ContentLayout title="聊天室語音朗讀">
        <div className="p-4 flex flex-col gap-4 justify-between min-h-[calc(100vh-200px)]">
          <div className="flex items-start w-full justify-between gap-4">
            {/* 頻道連接區域 */}
            <div className="flex gap-2 items-center p-4 bg-gray-100 rounded-lg flex-1">
              <Input
                type="text"
                value={channelInput}
                onChange={(e) => setChannelInput(e.target.value)}
                placeholder="例如：dada6621"
                disabled={isConnected}
                className="flex-1"
              />
              {!isConnected ? (
                <Button
                  onClick={() => connectToChat(channelInput)}
                  disabled={!channelInput.trim()}
                >
                  連接聊天室
                </Button>
              ) : (
                <Button onClick={disconnectFromChat} variant="destructive">
                  中斷連接
                </Button>
              )}
              {isConnected && (
                <span className="text-green-600 text-sm whitespace-nowrap">
                  ✓ 已連接到 {channelName}
                </span>
              )}

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-5 w-5 text-gray-500 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="bg-gray-200 text-black max-w-md">
                    <div className="flex flex-col gap-2 text-sm">
                      <div>1. 輸入頻道名稱，按下連接聊天室，聽到語音表示成功。</div>
                      <div>2. 如果語音終止，請中斷連接後重新連接。</div>
                      <div>3. 可在進階設定切換語音模型。</div>
                      <div>4. 關閉頁面後語音會自動停止。</div>
                      <div>5. 頻道名稱會自動保存，下次可直接使用。</div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* 語音設定區域 */}
            <div className="p-4 bg-gray-100 rounded-lg flex-1">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={isSpeechEnabled}
                    onCheckedChange={setIsSpeechEnabled}
                  />
                  <label className="text-sm font-medium">
                    語音播報 {isSpeechEnabled ? "開啟" : "關閉"}
                  </label>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                  className="flex items-center gap-2"
                >
                  <span>進階設定</span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform duration-200 ${
                      isSettingsOpen ? "rotate-180" : ""
                    }`}
                  />
                </Button>
              </div>

              <div
                className={`space-y-4 transition-all duration-300 ease-in-out overflow-hidden ${
                  isSettingsOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      語速 ({speechRate.toFixed(1)})
                    </label>
                    <Slider
                      value={[speechRate]}
                      min={0.5}
                      max={2}
                      step={0.1}
                      onValueChange={(value) => setSpeechRate(value[0])}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      音量 ({Math.round(speechVolume * 100)}%)
                    </label>
                    <Slider
                      value={[speechVolume]}
                      min={0}
                      max={1}
                      step={0.1}
                      onValueChange={(value) => setSpeechVolume(value[0])}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      音調 ({speechPitch.toFixed(1)})
                    </label>
                    <Slider
                      value={[speechPitch]}
                      min={0.5}
                      max={2}
                      step={0.1}
                      onValueChange={(value) => setSpeechPitch(value[0])}
                    />
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <Button
                    onClick={() =>
                      speak("這是一段測試語音，用來確認語音設定是否正確")
                    }
                    variant="outline"
                    disabled={!isSpeechEnabled}
                  >
                    測試語音
                  </Button>
                  <div className="flex-1 space-y-2">
                    {isMounted ? (
                      <Select
                        value={selectedVoice}
                        onValueChange={setSelectedVoice}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="選擇語音" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableVoices.map((voice) => (
                            <SelectItem key={voice.name} value={voice.name}>
                              {voice.name} ({voice.lang})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Select disabled>
                        <SelectTrigger>
                          <SelectValue placeholder="載入中..." />
                        </SelectTrigger>
                      </Select>
                    )}
                    <p className="text-xs text-gray-600">
                      如果沒有語音輸出，可能是 Chrome 130 版本的問題，建議選擇
                      Microsoft Hanhan。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 聊天訊息顯示區域 */}
          <div className="border rounded-lg p-4 h-[600px] relative bg-white">
            <div className="absolute bottom-0 left-0 right-0 max-h-full overflow-y-auto p-4 space-y-2">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <p>尚未有訊息，連接後會顯示聊天內容</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className="mb-2 animate-fade-in-up text-[28px]">
                    <span style={{ color: msg.color }} className="font-black">
                      {msg.displayName}
                    </span>
                    <span>: {msg.message}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </ContentLayout>
    </DashboardLayout>
  );
};

export default Chat;

