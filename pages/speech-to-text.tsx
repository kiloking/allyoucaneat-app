import { useState, useEffect, useRef } from "react";
import { Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";

const LANGUAGES = [
  { value: "zh-TW", label: "中文" },
  { value: "en", label: "英文" },
  { value: "ja", label: "日文" },
  { value: "ko", label: "韓文" },
  { value: "fr", label: "法文" },
  { value: "de", label: "德文" },
  { value: "es", label: "西班牙文" },
  { value: "ru", label: "俄文" },
];

export default function SpeechToText() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [interimTranslations, setInterimTranslations] = useState<
    Record<string, string>
  >({});
  const clearTimeoutRef = useRef<NodeJS.Timeout>();
  const lastTranscriptRef = useRef("");
  const lastResultTimeRef = useRef<number>(Date.now());
  const checkIntervalRef = useRef<NodeJS.Timeout>();
  const restartAttemptsRef = useRef(0);
  const maxRestartAttempts = 3;
  const [isTranslating, setIsTranslating] = useState(false);
  const silenceTimeoutRef = useRef<NodeJS.Timeout>();
  const lastSpeechTimeRef = useRef<number>(Date.now());
  const lastTranslationTimeRef = useRef<number>(Date.now());
  const SILENCE_THRESHOLD = 2000; // 2秒沒有新的語音輸入就視為停頓
  const [translationComplete, setTranslationComplete] = useState(false);
  const translationTimeoutRef = useRef<NodeJS.Timeout>();

  const {
    transcript: currentTranscript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable,
  } = useSpeechRecognition({
    commands: [],
    clearTranscriptOnListen: false,
  });

  // 設定狀態
  const [config, setConfig] = useState({
    sourceLanguage: "zh-TW",
    targetLanguages: ["en", "ja"],
    showOriginal: true,
    originalSize: 25,
    translatedSize: 25,
    originalColor: "#ffffff",
    translatedColor: "#ffffff",
    outlineColor: "#000000",
    outlineSize: 6,
    backgroundColor: "transparent",
    textPosition: "bottom",
    wordWrap: true,
    clearTimeout: 5000,
  });

  // 處理設定變更
  const handleConfigChange = (key: string, value: any) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  // 處理目標語言變更
  const handleTargetLanguageChange = (index: number, value: string) => {
    const newTargets = [...config.targetLanguages];
    newTargets[index] = value;
    setConfig((prev) => ({ ...prev, targetLanguages: newTargets }));
  };

  // 檢查語音辨識服務是否正常運作
  const checkRecognitionStatus = () => {
    if (!isRecording) return;

    const now = Date.now();
    const timeSinceLastResult = now - lastResultTimeRef.current;

    // 如果超過 5 秒沒有新的結果，嘗試重新啟動服務
    if (timeSinceLastResult > 5000) {
      console.log("檢測到語音辨識服務可能已停止，嘗試重新啟動");
      if (restartAttemptsRef.current < maxRestartAttempts) {
        restartAttemptsRef.current += 1;
        try {
          SpeechRecognition.stopListening();
          setTimeout(() => {
            SpeechRecognition.startListening({
              language: config.sourceLanguage,
              continuous: true,
              interimResults: true,
            });
          }, 1000);
        } catch (error) {
          console.error("重新啟動語音辨識失敗:", error);
          toast.error("語音辨識服務暫時無法使用，請稍後再試");
          setIsRecording(false);
        }
      } else {
        console.error("重新啟動次數過多，停止服務");
        toast.error("語音辨識服務暫時無法使用，請重新整理頁面");
        setIsRecording(false);
      }
    }
  };

  // 監聽語音辨識結果
  useEffect(() => {
    if (currentTranscript && currentTranscript !== lastTranscriptRef.current) {
      lastResultTimeRef.current = Date.now();
      lastSpeechTimeRef.current = Date.now();
      restartAttemptsRef.current = 0; // 重置重試次數
      setTranscript(currentTranscript);
      lastTranscriptRef.current = currentTranscript;
      setTranslationComplete(false);

      // 清除之前的計時器
      if (translationTimeoutRef.current) {
        clearTimeout(translationTimeoutRef.current);
      }

      // 即時翻譯
      const translateToTargetLanguages = async () => {
        setIsTranslating(true);
        const translations: Record<string, string> = {};
        try {
          // 先顯示臨時翻譯
          for (const target of config.targetLanguages) {
            if (target !== config.sourceLanguage) {
              translations[target] = `[${getLanguageLabel(target)}] 翻譯中...`;
            }
          }
          setInterimTranslations(translations);

          // 進行實際翻譯
          for (const target of config.targetLanguages) {
            if (target !== config.sourceLanguage) {
              const translatedText = await translateText(
                currentTranscript,
                target
              );
              translations[target] = `[${getLanguageLabel(
                target
              )}] ${translatedText}`;
            }
          }
          setTranslations(translations);
          setInterimTranslations({});
          setTranslationComplete(true);

          // 翻譯完成後等待8秒再清除
          translationTimeoutRef.current = setTimeout(() => {
            setTranscript("");
            setTranslations({});
            setInterimTranslations({});
            lastTranscriptRef.current = "";
            resetTranscript();
            setTranslationComplete(false);
          }, 8000); // 改為8秒
        } finally {
          setIsTranslating(false);
        }
      };

      translateToTargetLanguages();
    }
  }, [
    currentTranscript,
    config.sourceLanguage,
    config.targetLanguages,
    resetTranscript,
  ]);

  // 修改靜音檢測的 useEffect
  useEffect(() => {
    if (isRecording) {
      const checkSilence = () => {
        const now = Date.now();
        const timeSinceLastSpeech = now - lastSpeechTimeRef.current;

        if (
          timeSinceLastSpeech > SILENCE_THRESHOLD &&
          transcript &&
          translationComplete
        ) {
          console.log("檢測到靜音");
        }
      };

      const interval = setInterval(checkSilence, 500);
      return () => clearInterval(interval);
    }
  }, [isRecording, transcript, translationComplete, SILENCE_THRESHOLD]);

  // 監聽錄音狀態
  useEffect(() => {
    if (isRecording && !listening) {
      console.log("檢測到錄音狀態異常，嘗試重新啟動");
      if (restartAttemptsRef.current < maxRestartAttempts) {
        restartAttemptsRef.current += 1;
        try {
          SpeechRecognition.startListening({
            language: config.sourceLanguage,
            continuous: true,
            interimResults: true,
          });
        } catch (error) {
          console.error("重新啟動語音辨識失敗:", error);
          toast.error("語音辨識服務暫時無法使用，請稍後再試");
          setIsRecording(false);
        }
      }
    }
  }, [listening, isRecording]);

  // 修改清理效果
  useEffect(() => {
    const checkInterval = checkIntervalRef.current;
    return () => {
      if (checkInterval) {
        clearInterval(checkInterval);
      }
    };
  }, []);

  // 當來源語言改變時重新啟動
  useEffect(() => {
    if (isRecording) {
      SpeechRecognition.stopListening();
      setTimeout(() => {
        SpeechRecognition.startListening({ language: config.sourceLanguage });
      }, 1000);
    }
  }, [config.sourceLanguage, isRecording]);

  // 修改當 clearTimeout 設定改變時更新計時器的效果
  useEffect(() => {
    if (transcript && clearTimeoutRef.current && !isTranslating) {
      clearTimeout(clearTimeoutRef.current);
      clearTimeoutRef.current = setTimeout(() => {
        setTranscript("");
        setTranslations({});
        setInterimTranslations({});
        lastTranscriptRef.current = "";
        resetTranscript();
      }, config.clearTimeout);
    }
  }, [config.clearTimeout, isTranslating, resetTranscript, transcript]);

  // 修改清除字幕的函數
  const clearTranscript = () => {
    setTranscript("");
    setTranslations({});
    setInterimTranslations({});
    lastTranscriptRef.current = "";
    resetTranscript();
  };

  // 修改 toggleRecording 函數
  const toggleRecording = () => {
    if (!browserSupportsSpeechRecognition) {
      toast.error("您的瀏覽器不支援語音辨識功能");
      return;
    }

    if (!isMicrophoneAvailable) {
      toast.error("無法存取麥克風，請確認權限設定");
      return;
    }

    if (isRecording) {
      SpeechRecognition.stopListening();
      if (clearTimeoutRef.current) {
        clearTimeout(clearTimeoutRef.current);
      }
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
      restartAttemptsRef.current = 0;
    } else {
      clearTranscript();
      lastResultTimeRef.current = Date.now();
      restartAttemptsRef.current = 0;
      try {
        SpeechRecognition.startListening({
          language: config.sourceLanguage,
          continuous: true,
          interimResults: true,
        });
      } catch (error) {
        console.error("啟動語音辨識失敗:", error);
        toast.error("啟動語音辨識失敗");
        return;
      }
    }
    setIsRecording(!isRecording);
  };

  const getLanguageLabel = (value: string): string => {
    const lang = LANGUAGES.find((l) => l.value === value);
    return lang ? lang.label : value;
  };

  // 修改翻譯函數
  const translateText = async (
    text: string,
    targetLang: string
  ): Promise<string> => {
    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          target: targetLang,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "翻譯請求失敗");
      }

      const data = await response.json();
      return data.translatedText;
    } catch (error) {
      console.error("翻譯錯誤:", error);
      toast.error(error instanceof Error ? error.message : "翻譯服務發生錯誤");
      return `[翻譯錯誤] ${text}`;
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 設定面板 */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">設定</h2>
          <div className="space-y-4">
            {/* 來源語言 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">來源語言</label>
              <Select
                value={config.sourceLanguage}
                onValueChange={(value) =>
                  handleConfigChange("sourceLanguage", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="選擇來源語言" />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">目標語言 1</label>
              <Select
                value={config.targetLanguages[0]}
                onValueChange={(value) => handleTargetLanguageChange(0, value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.filter(
                    (lang) => lang.value !== config.sourceLanguage
                  ).map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">目標語言 2</label>
              <Select
                value={config.targetLanguages[1]}
                onValueChange={(value) => handleTargetLanguageChange(1, value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.filter(
                    (lang) =>
                      lang.value !== config.sourceLanguage &&
                      lang.value !== config.targetLanguages[0]
                  ).map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">顯示原文</label>
              <Switch
                checked={config.showOriginal}
                onCheckedChange={(checked) =>
                  handleConfigChange("showOriginal", checked)
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                原文字體大小 ({config.originalSize}px)
              </label>
              <Slider
                value={[config.originalSize]}
                min={12}
                max={48}
                step={1}
                onValueChange={(value) =>
                  handleConfigChange("originalSize", value[0])
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                翻譯字體大小 ({config.translatedSize}px)
              </label>
              <Slider
                value={[config.translatedSize]}
                min={12}
                max={48}
                step={1}
                onValueChange={(value) =>
                  handleConfigChange("translatedSize", value[0])
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                描邊大小 ({config.outlineSize}pt)
              </label>
              <Slider
                value={[config.outlineSize]}
                min={0}
                max={10}
                step={1}
                onValueChange={(value) =>
                  handleConfigChange("outlineSize", value[0])
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">原文顏色</label>
                <div className="flex">
                  <Input
                    type="color"
                    value={config.originalColor}
                    onChange={(e) =>
                      handleConfigChange("originalColor", e.target.value)
                    }
                    className="w-12 h-10 p-1"
                  />
                  <Input
                    type="text"
                    value={config.originalColor}
                    onChange={(e) =>
                      handleConfigChange("originalColor", e.target.value)
                    }
                    className="flex-1 ml-2"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">翻譯顏色</label>
                <div className="flex">
                  <Input
                    type="color"
                    value={config.translatedColor}
                    onChange={(e) =>
                      handleConfigChange("translatedColor", e.target.value)
                    }
                    className="w-12 h-10 p-1"
                  />
                  <Input
                    type="text"
                    value={config.translatedColor}
                    onChange={(e) =>
                      handleConfigChange("translatedColor", e.target.value)
                    }
                    className="flex-1 ml-2"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">描邊顏色</label>
              <div className="flex">
                <Input
                  type="color"
                  value={config.outlineColor}
                  onChange={(e) =>
                    handleConfigChange("outlineColor", e.target.value)
                  }
                  className="w-12 h-10 p-1"
                />
                <Input
                  type="text"
                  value={config.outlineColor}
                  onChange={(e) =>
                    handleConfigChange("outlineColor", e.target.value)
                  }
                  className="flex-1 ml-2"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">背景顏色</label>
              <div className="flex">
                <Input
                  type="color"
                  value={
                    config.backgroundColor === "transparent"
                      ? "#ffffff"
                      : config.backgroundColor
                  }
                  onChange={(e) =>
                    handleConfigChange("backgroundColor", e.target.value)
                  }
                  className="w-12 h-10 p-1"
                />
                <Input
                  type="text"
                  value={config.backgroundColor}
                  onChange={(e) =>
                    handleConfigChange("backgroundColor", e.target.value)
                  }
                  className="flex-1 ml-2"
                  placeholder="transparent"
                />
              </div>
              <p className="text-xs text-gray-500">
                輸入 &quot;transparent&quot; 可設為透明背景
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">文字位置</label>
              <Select
                value={config.textPosition}
                onValueChange={(value) =>
                  handleConfigChange("textPosition", value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="top">頂部</SelectItem>
                  <SelectItem value="middle">中間</SelectItem>
                  <SelectItem value="bottom">底部</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">自動換行</label>
              <Switch
                checked={config.wordWrap}
                onCheckedChange={(checked) =>
                  handleConfigChange("wordWrap", checked)
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                文字消失時間 ({config.clearTimeout / 1000} 秒)
              </label>
              <Slider
                value={[config.clearTimeout]}
                min={1000}
                max={10000}
                step={1000}
                onValueChange={(value) =>
                  handleConfigChange("clearTimeout", value[0])
                }
              />
            </div>
          </div>
        </Card>

        {/* 預覽面板 */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">預覽</h2>
          <div
            className={`relative w-full h-[500px] flex flex-col justify-${
              config.textPosition === "top"
                ? "start"
                : config.textPosition === "middle"
                ? "center"
                : "end"
            } p-4`}
            style={{
              backgroundColor:
                config.backgroundColor === "transparent"
                  ? "#333"
                  : config.backgroundColor,
            }}
          >
            <div className="w-full text-center space-y-2">
              {config.showOriginal && transcript && (
                <p
                  style={{
                    fontSize: `${config.originalSize}px`,
                    color: config.originalColor,
                    textShadow: `0 0 ${config.outlineSize}pt ${config.outlineColor}`,
                    fontWeight: 900,
                    wordBreak: config.wordWrap ? "break-word" : "keep-all",
                    whiteSpace: config.wordWrap ? "normal" : "nowrap",
                    maxWidth: "100%",
                  }}
                >
                  {transcript}
                </p>
              )}

              {Object.entries(translations).map(([lang, text]) => (
                <p
                  key={lang}
                  style={{
                    fontSize: `${config.translatedSize}px`,
                    color: config.translatedColor,
                    textShadow: `0 0 ${config.outlineSize}pt ${config.outlineColor}`,
                    fontWeight: 900,
                    wordBreak: config.wordWrap ? "break-word" : "keep-all",
                    whiteSpace: config.wordWrap ? "normal" : "nowrap",
                    maxWidth: "100%",
                  }}
                >
                  {text}
                </p>
              ))}

              {Object.entries(interimTranslations).map(([lang, text]) => (
                <p
                  key={lang}
                  style={{
                    fontSize: `${config.translatedSize}px`,
                    color: config.translatedColor,
                    textShadow: `0 0 ${config.outlineSize}pt ${config.outlineColor}`,
                    fontWeight: 900,
                    wordBreak: config.wordWrap ? "break-word" : "keep-all",
                    whiteSpace: config.wordWrap ? "normal" : "nowrap",
                    maxWidth: "100%",
                    opacity: 0.7,
                  }}
                >
                  {text.replace(/"/g, "&quot;")}
                </p>
              ))}
            </div>

            <div className="absolute top-4 right-4">
              <Button
                onClick={toggleRecording}
                variant={isRecording ? "destructive" : "default"}
                size="lg"
                className="w-16 h-16 rounded-full"
              >
                {isRecording ? (
                  <MicOff className="h-6 w-6" />
                ) : (
                  <Mic className="h-6 w-6" />
                )}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
