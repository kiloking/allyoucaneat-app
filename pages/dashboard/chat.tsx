import React, { useState, useEffect, useRef } from "react";
import tmi from "tmi.js";

const Chat = () => {
  const [channel, setChannel] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [client, setClient] = useState<tmi.Client | null>(null);
  const [messages, setMessages] = useState<JSX.Element[]>([]);

  // 語音設定狀態
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(true);
  const [speechRate, setSpeechRate] = useState(1);
  const [speechVolume, setSpeechVolume] = useState(1);
  const [speechPitch, setSpeechPitch] = useState(1);
  const [selectedVoice, setSelectedVoice] = useState("");
  const [availableVoices, setAvailableVoices] = useState<
    SpeechSynthesisVoice[]
  >([]);

  // 語音佇列
  const [speechQueue, setSpeechQueue] = useState<string[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const currentUtterance = useRef<SpeechSynthesisUtterance | null>(null);

  // 載入可用的語音
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      const chineseVoices = voices.filter(
        (voice) => voice.lang.includes("zh") || voice.lang.includes("cmn")
      );
      setAvailableVoices(chineseVoices);

      // 設定預設語音
      if (chineseVoices.length > 0 && !selectedVoice) {
        setSelectedVoice(chineseVoices[0].name);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // 處理語音佇列
  useEffect(() => {
    const processQueue = async () => {
      if (isSpeaking || speechQueue.length === 0) return;

      try {
        setIsSpeaking(true);
        const text = speechQueue[0];

        // 取消當前播放的語音
        if (window.speechSynthesis.speaking) {
          window.speechSynthesis.cancel();
        }

        const utterance = new SpeechSynthesisUtterance(text);
        currentUtterance.current = utterance;

        // 設定語音參數
        utterance.voice =
          availableVoices.find((voice) => voice.name === selectedVoice) || null;
        utterance.rate = speechRate;
        utterance.volume = speechVolume;
        utterance.pitch = speechPitch;
        utterance.lang = "zh-TW";

        // 處理語音結束事件
        utterance.onend = () => {
          setIsSpeaking(false);
          setSpeechQueue((prev) => prev.slice(1));
          currentUtterance.current = null;
        };

        // 處理語音錯誤
        utterance.onerror = (event) => {
          console.error("語音播放錯誤:", event);
          setIsSpeaking(false);
          setSpeechQueue((prev) => prev.slice(1));
          currentUtterance.current = null;
        };

        // 開始播放
        window.speechSynthesis.speak(utterance);
      } catch (error) {
        console.error("語音處理錯誤:", error);
        setIsSpeaking(false);
        setSpeechQueue((prev) => prev.slice(1));
      }
    };

    processQueue();
  }, [
    speechQueue,
    isSpeaking,
    selectedVoice,
    speechRate,
    speechVolume,
    speechPitch,
    availableVoices,
  ]);

  // 語音播放函數
  const speak = (text: string) => {
    if (!isSpeechEnabled) return;

    const trimmedText = text.trim();
    if (!trimmedText) return;

    setSpeechQueue((prev) => [...prev, trimmedText]);
  };

  // 清除語音佇列
  const clearSpeechQueue = () => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    setSpeechQueue([]);
    setIsSpeaking(false);
    currentUtterance.current = null;
  };

  // 連接到聊天室
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
            const systemBots = [
              "Nightbot",
              "StreamElements",
              "Moobot",
              "Streamlabs",
            ];
            const username = tags.username?.toLowerCase() || "";

            if (
              systemBots.some((bot) => username.includes(bot.toLowerCase()))
            ) {
              return;
            }

            const displayName = tags["display-name"] || tags.username;
            const userColor = tags.color || "#8A2BE2";

            // 處理語音訊息 - 只念出聊天內容
            let speechMessage = message;
            if (message.includes("https://") || message.includes("http://")) {
              speechMessage = "連結懶得念";
            }

            const messageComponent = (
              <div className="mb-2 animate-fade-in-up text-[28px]">
                <span style={{ color: userColor }} className="font-black">
                  {displayName}
                </span>
                <span>: {message}</span>
              </div>
            );

            setMessages((prev) => [...prev, messageComponent]);
            // 只念出聊天內容
            speak(speechMessage);
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
      clearSpeechQueue();
      speak("已斷開連接");
    }
  };

  // 組件卸載時清理
  useEffect(() => {
    return () => {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
      clearSpeechQueue();
    };
  }, []);

  return (
    <div className="p-4">
      <div className="mb-4 flex items-start w-full justify-between gap-2">
        <div className="flex gap-2 items-center p-4 bg-gray-100 rounded-lg w-1/2">
          <input
            type="text"
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            placeholder="輸入 Twitch 頻道名稱"
            className="border p-2 rounded text-xl"
            disabled={isConnected}
          />
          {!isConnected ? (
            <button
              onClick={() => connectToChat(channel)}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition-colors"
              disabled={!channel.trim()}
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

        <div className="p-4 bg-gray-100 rounded-lg mb-4 w-1/2">
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

            <button
              onClick={() =>
                speak("這是一段測試語音，用來確認語音設定是否正確")
              }
              className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 transition-colors"
              disabled={!isSpeechEnabled}
            >
              測試語音
            </button>

            <div className="flex flex-col gap-2">
              <select
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
                className="border p-2 rounded"
              >
                {availableVoices.map((voice) => (
                  <option key={voice.name} value={voice.name}>
                    {voice.name} ({voice.lang})
                  </option>
                ))}
              </select>

              {/* 添加提示文字 */}
              <span className="text-sm text-gray-600">
                如果沒有講話，是Chrome 130版本的問題，目前建議選語舒。
              </span>
            </div>

            {/* 佇列狀態和清除按鈕 */}
            {speechQueue.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  {isSpeaking ? "正在播放" : "等待播放"}
                </span>
                <button
                  onClick={clearSpeechQueue}
                  className="px-2 py-1 rounded bg-yellow-500 text-white hover:bg-yellow-600"
                >
                  清除佇列 ({speechQueue.length})
                </button>
              </div>
            )}
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
