import { useState, useEffect, useRef, useCallback } from "react";

interface SpeechConfig {
  enabled: boolean;
  rate: number;
  volume: number;
  pitch: number;
  voice: string;
}

interface UseSpeechSynthesisOptions {
  defaultConfig?: Partial<SpeechConfig>;
}

export function useSpeechSynthesis(options: UseSpeechSynthesisOptions = {}) {
  const [isEnabled, setIsEnabled] = useState(true);
  const [rate, setRate] = useState(options.defaultConfig?.rate ?? 1);
  const [volume, setVolume] = useState(options.defaultConfig?.volume ?? 1);
  const [pitch, setPitch] = useState(options.defaultConfig?.pitch ?? 1);
  const [selectedVoice, setSelectedVoice] = useState("");
  const [availableVoices, setAvailableVoices] = useState<
    SpeechSynthesisVoice[]
  >([]);

  const [speechQueue, setSpeechQueue] = useState<string[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const currentUtterance = useRef<SpeechSynthesisUtterance | null>(null);
  const hasSetDefaultVoice = useRef(false);

  // 載入可用的語音
  useEffect(() => {
    // 確保只在客戶端執行
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      const chineseVoices = voices.filter(
        (voice) => voice.lang.includes("zh") || voice.lang.includes("cmn")
      );
      setAvailableVoices(chineseVoices);

      // 如果還沒有選擇語音且尚未設置過預設語音，設定預設語音
      if (
        !selectedVoice &&
        !hasSetDefaultVoice.current &&
        chineseVoices.length > 0
      ) {
        hasSetDefaultVoice.current = true;
        const googleTaiwanVoice = chineseVoices.find(
          (voice) => voice.name === "Google 國語（臺灣）"
        );

        if (googleTaiwanVoice) {
          setSelectedVoice(googleTaiwanVoice.name);
        } else {
          setSelectedVoice(chineseVoices[0].name);
        }
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 處理語音佇列
  useEffect(() => {
    // 確保只在客戶端執行
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    if (isSpeaking || speechQueue.length === 0 || !isEnabled) return;

    const processQueue = () => {
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
        const voice = availableVoices.find((v) => v.name === selectedVoice);
        if (voice) {
          utterance.voice = voice;
        }
        utterance.rate = rate;
        utterance.volume = volume;
        utterance.pitch = pitch;
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
    rate,
    volume,
    pitch,
    availableVoices,
    isEnabled,
  ]);

  // 語音播放函數
  const speak = useCallback(
    (text: string) => {
      if (!isEnabled) return;

      const trimmedText = text.trim();
      if (!trimmedText) return;

      setSpeechQueue((prev) => [...prev, trimmedText]);
    },
    [isEnabled]
  );

  // 清除語音佇列
  const clearQueue = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
    }
    setSpeechQueue([]);
    setIsSpeaking(false);
    currentUtterance.current = null;
  }, []);

  // 組件卸載時清理
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        if (window.speechSynthesis.speaking) {
          window.speechSynthesis.cancel();
        }
      }
      clearQueue();
    };
  }, [clearQueue]);

  return {
    // 狀態
    isEnabled,
    rate,
    volume,
    pitch,
    selectedVoice,
    availableVoices,
    isSpeaking,

    // 設定函數
    setIsEnabled,
    setRate,
    setVolume,
    setPitch,
    setSelectedVoice,

    // 控制函數
    speak,
    clearQueue,
  };
}
