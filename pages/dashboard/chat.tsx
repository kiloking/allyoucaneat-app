import React, { useState, useEffect, useRef } from "react";
import tmi from "tmi.js";

const Chat = () => {
  const [channel, setChannel] = useState("");
  // 新增語音設定狀態
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(true);
  const [voiceRate, setVoiceRate] = useState(1);
  const [voiceVolume, setVoiceVolume] = useState(1);
  const [voicePitch, setVoicePitch] = useState(1);
  const [availableVoices, setAvailableVoices] = useState<
    SpeechSynthesisVoice[]
  >([]);
  const [selectedVoice, setSelectedVoice] = useState<string>("");
  // 新增語音佇列狀態
  const [speechQueue, setSpeechQueue] = useState<string[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // 處理語音佇列
  useEffect(() => {
    const processQueue = async () => {
      if (speechQueue.length > 0 && !isSpeaking && isSpeechEnabled) {
        setIsSpeaking(true);
        const text = speechQueue[0];

        const utterance = new SpeechSynthesisUtterance(text);
        const voice = availableVoices.find((v) => v.name === selectedVoice);
        if (voice) utterance.voice = voice;

        utterance.lang = "zh-TW";
        utterance.rate = voiceRate;
        utterance.pitch = voicePitch;
        utterance.volume = voiceVolume;

        // 語音結束後處理下一個
        utterance.onend = () => {
          setSpeechQueue((prev) => prev.slice(1));
          setIsSpeaking(false);
        };

        utterance.onerror = (event) => {
          console.error("語音播放錯誤:", event);
          setSpeechQueue((prev) => prev.slice(1));
          setIsSpeaking(false);
        };

        window.speechSynthesis.speak(utterance);
      }
    };

    processQueue();
  }, [
    speechQueue,
    isSpeaking,
    isSpeechEnabled,
    selectedVoice,
    voiceRate,
    voicePitch,
    voiceVolume,
    availableVoices,
  ]);

  // 修改原本的 speak 函數
  const addToSpeechQueue = (text: string) => {
    if (!isSpeechEnabled) return;
    setSpeechQueue((prev) => [...prev, text]);
  };

  const speak = (text: string) => {
    if (!isSpeechEnabled || !window.speechSynthesis) return;

    // 取消所有正在播放的語音
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    // 設定選擇的語音
    const voice = availableVoices.find((v) => v.name === selectedVoice);
    if (voice) utterance.voice = voice;

    utterance.lang = "zh-TW";
    utterance.rate = voiceRate;
    utterance.pitch = voicePitch;
    utterance.volume = voiceVolume;
    // 添加語音播放的事件監聽，用於除錯
    utterance.onstart = () => console.log("開始播放語音");
    utterance.onend = () => console.log("語音播放結束");
    utterance.onerror = (event) => console.error("語音播放錯誤:", event);

    window.speechSynthesis.speak(utterance);
  };

  const [isConnected, setIsConnected] = useState(false);
  const [client, setClient] = useState<tmi.Client | null>(null);
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
          addToSpeechQueue("聊天室已連結完成");

          newClient.on("message", (channel, tags, message, self) => {
            // 過濾系統機器人
            const systemBots = ["Nightbot", "StreamElements"];
            if (systemBots.includes(tags.username || "")) {
              return;
            }
            const displayName = tags["display-name"] || tags.username;
            const userColor = tags.color || "#8A2BE2"; // 預設紫色
            // 處理訊息內容
            let processedMessage = message;
            let speechMessage = message;

            // 檢查是否包含網址
            if (message.includes("https://") || message.includes("http://")) {
              processedMessage = message; // 顯示原始訊息
              speechMessage = "連結懶得念"; // 語音播報用的文字
            }

            const messageComponent = (
              <div className="mb-2 animate-fade-in-up text-[28px]">
                <span style={{ color: userColor }} className=" font-black">
                  {displayName}
                </span>
                <span>: {processedMessage}</span>
              </div>
            );
            setMessages((prev) => [...prev, messageComponent]);

            // 將訊息加入語音佇列
            if (isSpeechEnabled) {
              addToSpeechQueue(speechMessage);
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
  const [messages, setMessages] = useState<JSX.Element[]>([]);
  // 新增清空佇列的功能
  const clearSpeechQueue = () => {
    window.speechSynthesis.cancel();
    setSpeechQueue([]);
    setIsSpeaking(false);
  };

  // 在斷開連接時清空佇列
  const disconnectFromChat = () => {
    if (client) {
      client.disconnect();
      setClient(null);
      setIsConnected(false);
      setMessages([]);
      clearSpeechQueue();
    }
  };

  // 初始化語音系統
  useEffect(() => {
    // 確保語音系統已載入
    const initVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      const chineseVoices = voices.filter(
        (voice) => voice.lang.includes("zh") || voice.lang.includes("cmn")
      );
      console.log("可用的中文語音：", chineseVoices); // 用於除錯
      setAvailableVoices(chineseVoices);
      const defaultVoice = chineseVoices.find(
        (voice) => voice.name.includes("Google") && voice.name.includes("臺灣")
      );
      if (defaultVoice) {
        setSelectedVoice(defaultVoice.name);
        setTimeout(() => {
          addToSpeechQueue("語音系統已初始化");
        }, 100);
      } else if (chineseVoices.length > 0) {
        // 如果找不到指定語音，則使用第一個可用的中文語音
        setSelectedVoice(chineseVoices[0].name);
        setTimeout(() => {
          addToSpeechQueue("語音系統已初始化");
        }, 100);
      }
    };

    if (window.speechSynthesis) {
      // Chrome需要這個事件
      window.speechSynthesis.onvoiceschanged = initVoices;
      initVoices();
    }
  }, []);

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
        <div className="p-4 bg-gray-100 rounded-lg w-full">
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

            {/* 語音選擇 */}
            <select
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
              className="border p-2 rounded"
            >
              {availableVoices.map((voice) => (
                <option key={voice.name} value={voice.name}>
                  {voice.name}
                </option>
              ))}
            </select>
          </div>

          {/* 語音設定滑桿 */}
          <div className="space-y-2">
            <div>
              <label className="block text-sm">語速 ({voiceRate})</label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={voiceRate}
                onChange={(e) => setVoiceRate(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm">
                音量 ({Math.round(voiceVolume * 100)}%)
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={voiceVolume}
                onChange={(e) => setVoiceVolume(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm">音調 ({voicePitch})</label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={voicePitch}
                onChange={(e) => setVoicePitch(Number(e.target.value))}
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
