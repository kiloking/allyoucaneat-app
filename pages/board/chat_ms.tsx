import React, { useState, useEffect, useRef, useMemo } from "react";
import * as sdk from "microsoft-cognitiveservices-speech-sdk";
import tmi from "tmi.js";

const Chat = () => {
  const [channel, setChannel] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [client, setClient] = useState<tmi.Client | null>(null);
  const [messages, setMessages] = useState<JSX.Element[]>([]);

  // 新增語音設定狀態
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(true);
  const [speechRate, setSpeechRate] = useState(1);
  const [speechVolume, setSpeechVolume] = useState(1);
  const [speechPitch, setSpeechPitch] = useState(1);
  const [selectedVoice, setSelectedVoice] = useState("zh-CN-YunxiNeural");

  const [azureConfig, setAzureConfig] = useState<{
    key: string;
    region: string;
  } | null>(null);

  // 獲取 Azure 設定
  const fetchAzureConfig = async () => {
    try {
      const response = await fetch("/api/speech-token", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_AUTH_TOKEN}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("取得語音設定失敗");
      }

      const config = await response.json();
      setAzureConfig(config);
    } catch (error) {
      console.error("取得語音設定錯誤:", error);
    }
  };

  // 在組件載入時獲取設定
  useEffect(() => {
    fetchAzureConfig();
  }, []);

  // 需要添加 speechConfig 的初始化
  const speechConfig = useMemo(() => {
    if (!azureConfig) return null;

    try {
      const config = sdk.SpeechConfig.fromSubscription(
        azureConfig.key,
        azureConfig.region
      );
      config.speechSynthesisVoiceName = selectedVoice;
      return config;
    } catch (error) {
      console.error("Azure Speech 初始化錯誤:", error);
      return null;
    }
  }, [azureConfig, selectedVoice]);

  // 添加語音佇列狀態
  const [speechQueue, setSpeechQueue] = useState<string[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const currentSynthesizer = useRef<sdk.SpeechSynthesizer | null>(null);

  // 處理語音佇列
  // 處理語音佇列
  useEffect(() => {
    const processQueue = async () => {
      // 如果正在說話或佇列為空，直接返回
      if (isSpeaking || speechQueue.length === 0 || !speechConfig) return;

      try {
        setIsSpeaking(true);
        const text = speechQueue[0];

        // 確保先關閉之前的合成器
        if (currentSynthesizer.current) {
          currentSynthesizer.current.close();
          currentSynthesizer.current = null;
        }

        const synthesizer = new sdk.SpeechSynthesizer(speechConfig);
        currentSynthesizer.current = synthesizer;

        const ssml = `
        <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="zh-TW">
          <voice name="${selectedVoice}">
            <prosody rate="${speechRate}" 
                     pitch="${speechPitch}%" 
                     volume="${Math.round(speechVolume * 100)}%">
              ${text}
            </prosody>
          </voice>
        </speak>
      `;

        // 使用 Promise 確保語音播放完成
        await new Promise((resolve, reject) => {
          synthesizer.speakSsmlAsync(
            ssml,
            (result) => {
              synthesizer.close();
              currentSynthesizer.current = null;
              resolve(result);
            },
            (error) => {
              console.error("語音合成錯誤:", error);
              synthesizer.close();
              currentSynthesizer.current = null;
              reject(error);
            }
          );
        });

        // 成功播放後才移除佇列中的項目
        setSpeechQueue((prev) => prev.slice(1));
      } catch (error) {
        console.error("語音播放錯誤:", error);
        // 發生錯誤時也要移除，避免卡住
        setSpeechQueue((prev) => prev.slice(1));
      } finally {
        setIsSpeaking(false);
      }
    };

    processQueue();
  }, [
    speechQueue,
    isSpeaking,
    speechConfig,
    selectedVoice,
    speechRate,
    speechPitch,
    speechVolume,
  ]);

  // 修改 speak 函數
  const speak = (text: string) => {
    if (!isSpeechEnabled) return;

    // 過濾空白訊息
    const trimmedText = text.trim();
    if (!trimmedText) return;

    // 將新訊息加入佇列
    setSpeechQueue((prev) => [...prev, trimmedText]);
  };
  // 添加清除佇列的函數
  const clearSpeechQueue = () => {
    if (currentSynthesizer.current) {
      currentSynthesizer.current.close();
      currentSynthesizer.current = null;
    }
    setSpeechQueue([]);
    setIsSpeaking(false);
  };
  useEffect(() => {
    return () => {
      if (currentSynthesizer.current) {
        currentSynthesizer.current.close();
      }
      clearSpeechQueue();
    };
  }, []);

  const connectToChat = (channelName: string) => {
    if (isConnected || !channelName.trim()) return;

    try {
      const newClient = new tmi.Client({
        channels: [channelName],
      });

      newClient
        .connect()
        .then(() => {
          setIsConnected(true);
          setClient(newClient);
          speak("聊天室已連結完成");
          newClient.on("message", (channel, tags, message, self) => {
            // 過濾系統機器人
            const systemBots = [
              "Nightbot",
              "StreamElements",
              "Moobot",
              "Streamlabs",
            ];
            const username = tags.username?.toLowerCase() || "";

            // 檢查是否為機器人
            if (
              systemBots.some((bot) => username.includes(bot.toLowerCase()))
            ) {
              console.log("過濾機器人訊息:", username);
              return;
            }
            const displayName = tags["display-name"] || tags.username;
            const userColor = tags.color || "#8A2BE2"; // 預設紫色
            // 處理訊息內容
            let speechMessage = message;
            if (message.includes("https://") || message.includes("http://")) {
              speechMessage = "連結懶得念";
            }

            // 檢查是否包含網址
            if (message.includes("https://") || message.includes("http://")) {
              speechMessage = "連結懶得念"; // 語音播報用的文字
            }

            const messageComponent = (
              <div className="mb-2 animate-fade-in-up text-[28px]">
                <span style={{ color: userColor }} className=" font-black">
                  {displayName}
                </span>
                <span>: {message}</span>
              </div>
            );
            setMessages((prev) => [...prev, messageComponent]);

            // 將訊息加入語音佇列
            if (isSpeechEnabled) {
              speak(speechMessage);
            }
          });
        })
        .catch((err) => {
          console.error("連接失敗:", err);
          alert("連接失敗，請檢查頻道名稱是否正確");
        });
    } catch (err) {
      console.error("建立連接時發生錯誤:", err);
    }
  };
  // 斷開連接
  const disconnectFromChat = () => {
    if (client) {
      client.disconnect();
      setClient(null);
      setIsConnected(false);
      setMessages([]);
      clearSpeechQueue(); // 清除所有待播放的語音
      speak("已斷開連接"); // 加入最後的提示音
    }
  };
  // 除錯用
  useEffect(() => {
    console.log("Azure Key:", process.env.NEXT_PUBLIC_AZURE_SPEECH_KEY);
    console.log("Azure Region:", process.env.NEXT_PUBLIC_AZURE_SPEECH_REGION);
  }, []);

  // 在組件頂部添加狀態來存儲可用的語音
  const [availableVoices, setAvailableVoices] = useState<
    { name: string; displayName: string }[]
  >([]);

  // 添加一個函數來獲取可用的語音列表
  const listAvailableVoices = async () => {
    if (!speechConfig) return;

    try {
      const synthesizer = new sdk.SpeechSynthesizer(speechConfig);
      const result = await synthesizer.getVoicesAsync();

      // 過濾出中文語音
      const chineseVoices = result.voices.filter(
        (voice) => voice.locale.includes("zh-") || voice.locale.includes("cmn-")
      );

      console.log("所有可用的中文語音：", chineseVoices);

      const voiceList = chineseVoices.map((voice) => ({
        name: voice.name,
        displayName: voice.localName,
      }));

      setAvailableVoices(voiceList);
      synthesizer.close();
    } catch (error) {
      console.error("獲取語音列表失敗:", error);
    }
  };

  // 在組件載入時獲取語音列表
  useEffect(() => {
    listAvailableVoices();
  }, [speechConfig]);

  return (
    <div className="p-4">
      <div className="mb-4 flex items-start w-full justify-between gap-2">
        {/* 原有的輸入和連接按鈕 */}
        <div className=" flex gap-2 items-center p-4 bg-gray-100 rounded-lg w-full">
          <input
            type="text"
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            placeholder="輸入 Twitch 頻道名稱"
            className="border p-2 rounded text-xl"
            disabled={isConnected} // 連接時禁用輸入
          />
          {!isConnected ? (
            <button
              onClick={() => connectToChat(channel)}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition-colors"
              disabled={!channel.trim()} // 沒有輸入時禁用按鈕
            >
              連接聊天室
            </button>
          ) : (
            <button
              onClick={disconnectFromChat}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
            >
              中斷連接
            </button>
          )}
          {isConnected && (
            <span className="text-green-600 ml-2">✓ 已連接到 {channel}</span>
          )}
        </div>

        {/* 語音控制面板 */}
        <div className="p-4 bg-gray-100 rounded-lg mb-4">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => setIsSpeechEnabled(!isSpeechEnabled)}
              className={`px-4 py-2 rounded ${
                isSpeechEnabled
                  ? "bg-green-600 text-white"
                  : "bg-gray-300 text-gray-700"
              }`}
            >
              語音播報 {isSpeechEnabled ? "開啟" : "關閉"}
            </button>

            <select
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
              className="border p-2 rounded"
            >
              {availableVoices.map((voice) => (
                <option key={voice.name} value={voice.name}>
                  {voice.displayName}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <div>
              <label className="block text-sm">語速 ({speechRate})</label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={speechRate}
                onChange={(e) => setSpeechRate(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm">
                音量 ({Math.round(speechVolume * 100)}%)
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={speechVolume}
                onChange={(e) => setSpeechVolume(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm">音調 ({speechPitch})</label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={speechPitch}
                onChange={(e) => setSpeechPitch(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="border rounded p-4 h-[500px] relative">
        <div className="absolute bottom-0 left-0 right-0 max-h-full overflow-y-auto p-2">
          {messages.map((msg, index) => (
            <div key={index} className="mb-2 animate-fade-in-up">
              {msg}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Chat;
