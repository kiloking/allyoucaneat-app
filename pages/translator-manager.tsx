import { useState, useEffect, useRef } from "react";
import Head from "next/head";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";

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

export default function TranslatorManager() {
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
    fontFamily: "Noto Sans TC",
  });

  // 測試狀態
  const [isTesting, setIsTesting] = useState(false);
  const [recognizedText, setRecognizedText] = useState("");
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const recognitionRef = useRef<any>(null);
  const [widgetUrl, setWidgetUrl] = useState("");

  // 預設值狀態
  const [presets, setPresets] = useState<
    Array<{ name: string; config: typeof config }>
  >([]);
  const [currentPreset, setCurrentPreset] = useState("");

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

  // 開始測試
  const startTest = () => {
    if (!isTesting) {
      setIsTesting(true);
      initSpeechRecognition();
    }
  };

  // 停止測試
  const stopTest = () => {
    if (isTesting) {
      setIsTesting(false);
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      setRecognizedText("");
      setTranslations({});
    }
  };

  // 初始化語音辨識
  const initSpeechRecognition = async () => {
    if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
      toast.error("您的瀏覽器不支援語音辨識功能");
      setIsTesting(false);
      return;
    }

    // 嘗試獲取麥克風權限，使用更寬鬆的設定
    try {
      // 添加更多選項以提高兼容性
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          // 不指定特定設備，讓瀏覽器選擇可用的麥克風
        },
      });

      // 成功獲取麥克風，但我們不需要這個流，可以關閉它
      stream.getTracks().forEach((track) => track.stop());

      console.log("成功獲取麥克風權限");
    } catch (error) {
      console.error("無法獲取麥克風權限:", error);

      if ((error as any).name === "NotReadableError") {
        toast.error(
          "麥克風正被其他應用程式使用，請關閉可能使用麥克風的應用後再試"
        );
      } else if ((error as any).name === "NotFoundError") {
        toast.error("找不到麥克風設備，請確認您的電腦已連接麥克風");
      } else if ((error as any).name === "NotAllowedError") {
        toast.error("麥克風權限被拒絕，請允許網站使用麥克風");
      } else {
        toast.error(
          `無法獲取麥克風權限: ${(error as any).message || "未知錯誤"}`
        );
      }

      setIsTesting(false);
      return;
    }

    // 檢查是否有可用的音訊輸入設備
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter(
        (device) => device.kind === "audioinput"
      );

      if (audioInputs.length === 0) {
        toast.error("未檢測到任何麥克風設備");
        setIsTesting(false);
        return;
      }

      // 可以在這裡添加麥克風選擇功能
      console.log("可用的麥克風設備:", audioInputs);
    } catch (error) {
      console.error("無法列舉音訊設備:", error);
    }

    // 初始化語音辨識
    try {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = getLangCode(config.sourceLanguage);

      recognition.onresult = async (event: any) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        if (finalTranscript) {
          setRecognizedText(finalTranscript);

          // 模擬翻譯 (實際應用中應調用翻譯 API)
          const mockTranslations: Record<string, string> = {};
          for (const target of config.targetLanguages) {
            if (target !== config.sourceLanguage) {
              mockTranslations[target] = `[${getLanguageLabel(
                target
              )}] ${finalTranscript}`;
            }
          }
          setTranslations(mockTranslations);
        } else if (interimTranscript) {
          setRecognizedText(interimTranscript);
        }
      };

      recognition.onend = () => {
        if (isTesting) {
          try {
            recognition.start();
          } catch (e) {
            console.error("重新啟動語音辨識失敗:", e);
            toast.error("語音辨識意外停止，請重新開始測試");
            setIsTesting(false);
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.error("語音辨識錯誤:", event.error);

        if (event.error === "not-allowed") {
          toast.error("麥克風權限被拒絕，請允許網站使用麥克風");
          setIsTesting(false);
        } else if (event.error === "audio-capture") {
          toast.error("無法捕獲音訊，請確認麥克風正常工作");
          setIsTesting(false);
        } else if (event.error === "network") {
          toast.error("網路錯誤，請檢查您的網路連接");
        } else {
          toast.error(`語音辨識錯誤: ${event.error}`);
        }
      };

      try {
        recognition.start();
        toast.success("語音辨識已啟動");
        recognitionRef.current = recognition;
      } catch (error) {
        console.error("啟動語音辨識失敗:", error);
        toast.error("啟動語音辨識失敗");
        setIsTesting(false);
      }
    } catch (error) {
      console.error("初始化語音辨識失敗:", error);
      toast.error("初始化語音辨識失敗");
      setIsTesting(false);
    }
  };

  // 生成 Widget URL
  const generateWidgetUrl = () => {
    const params = new URLSearchParams({
      source: config.sourceLanguage,
      targets: config.targetLanguages.join(","),
      showOriginal: config.showOriginal.toString(),
      originalSize: config.originalSize.toString(),
      translatedSize: config.translatedSize.toString(),
      originalColor: encodeURIComponent(config.originalColor),
      translatedColor: encodeURIComponent(config.translatedColor),
      outlineColor: encodeURIComponent(config.outlineColor),
      outlineSize: config.outlineSize.toString(),
      backgroundColor: encodeURIComponent(config.backgroundColor),
      textPosition: config.textPosition,
      wordWrap: config.wordWrap.toString(),
      clearTimeout: config.clearTimeout.toString(),
      fontFamily: encodeURIComponent(config.fontFamily),
    });

    const url = `${
      window.location.origin
    }/widgets/translatorplayer?${params.toString()}`;
    setWidgetUrl(url);
    toast.success("已生成 Widget 網址");
  };

  // 儲存預設值
  const savePreset = (name: string) => {
    if (!name) return;

    const newPresets = [
      ...presets.filter((p) => p.name !== name),
      { name, config: { ...config } },
    ];
    setPresets(newPresets);
    localStorage.setItem("translatorPresets", JSON.stringify(newPresets));
    setCurrentPreset("");
    toast.success(`已儲存預設值: ${name}`);
  };

  // 載入預設值
  const loadPreset = (name: string) => {
    const preset = presets.find((p) => p.name === name);
    if (preset) {
      setConfig(preset.config);
      toast.success(`已載入預設值: ${name}`);
    }
  };

  // 刪除預設值
  const deletePreset = (name: string) => {
    const newPresets = presets.filter((p) => p.name !== name);
    setPresets(newPresets);
    localStorage.setItem("translatorPresets", JSON.stringify(newPresets));
    toast.success(`已刪除預設值: ${name}`);
  };

  // 輔助函數
  const getLangCode = (lang: string): string => {
    const langMap: Record<string, string> = {
      "zh-TW": "zh-TW",
      en: "en-US",
      ja: "ja-JP",
      ko: "ko-KR",
      fr: "fr-FR",
      de: "de-DE",
      es: "es-ES",
      ru: "ru-RU",
    };
    return langMap[lang] || lang;
  };

  const getLanguageLabel = (value: string): string => {
    const lang = LANGUAGES.find((l) => l.value === value);
    return lang ? lang.label : value;
  };

  // 清理效果
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  return (
    <>
      <Head>
        <title>翻譯機設定 | TwitchMeow</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-2">
                <h1 className="text-4xl font-bold text-gray-900">
                  即時翻譯機{" "}
                  <span className="text-sm text-gray-500">測試版</span>
                </h1>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-5 w-5 text-gray-500" />
                    </TooltipTrigger>
                    <TooltipContent className="bg-gray-200 text-black">
                      <div className="flex flex-col gap-2 items-start">
                        <div>1. 設定來源語言和目標語言</div>
                        <div>2. 調整顯示設定</div>
                        <div>3. 測試翻譯效果</div>
                        <div>4. 生成 Widget 網址並複製到 OBS</div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              <p className="text-gray-600">
                即時翻譯您的語音為多種語言，幫助不同語言的觀眾理解直播內容。
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 設定面板 */}
              <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
                <h2 className="text-xl font-semibold">語言設定</h2>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">來源語言</label>
                    <Select
                      value={config.sourceLanguage}
                      onValueChange={(value) =>
                        handleConfigChange("sourceLanguage", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
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
                      onValueChange={(value) =>
                        handleTargetLanguageChange(0, value)
                      }
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
                      onValueChange={(value) =>
                        handleTargetLanguageChange(1, value)
                      }
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
                </div>

                <h2 className="text-xl font-semibold pt-4">顯示設定</h2>

                <div className="space-y-4">
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
                            handleConfigChange(
                              "translatedColor",
                              e.target.value
                            )
                          }
                          className="w-12 h-10 p-1"
                        />
                        <Input
                          type="text"
                          value={config.translatedColor}
                          onChange={(e) =>
                            handleConfigChange(
                              "translatedColor",
                              e.target.value
                            )
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

                <div className="pt-4 flex space-x-4">
                  <Button
                    onClick={startTest}
                    className="flex-1"
                    size="lg"
                    disabled={isTesting}
                  >
                    開始測試
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
                              toast.error("複製失敗");
                            });
                        }}
                      >
                        複製
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* 預覽面板 */}
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="p-4 bg-gray-800 text-white">
                  <h2 className="text-xl font-semibold">預覽</h2>
                </div>
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
                    {/* 原文 */}
                    {config.showOriginal && (recognizedText || !isTesting) && (
                      <div
                        className="inline-block px-2 py-1 rounded"
                        style={{
                          fontSize: `${config.originalSize}px`,
                          fontWeight: 900,
                          color: config.originalColor,
                          textShadow: `0 0 ${config.outlineSize}pt ${config.outlineColor}`,
                          fontFamily: config.fontFamily || "sans-serif",
                          wordBreak: config.wordWrap
                            ? "break-word"
                            : "keep-all",
                          whiteSpace: config.wordWrap ? "normal" : "nowrap",
                          maxWidth: "100%",
                        }}
                      >
                        {isTesting ? recognizedText : "原文示例"}
                      </div>
                    )}

                    {/* 翻譯 */}
                    {isTesting
                      ? Object.entries(translations).map(([lang, text]) => (
                          <div
                            key={lang}
                            className="inline-block px-2 py-1 rounded"
                            style={{
                              fontSize: `${config.translatedSize}px`,
                              fontWeight: 900,
                              color: config.translatedColor,
                              textShadow: `0 0 ${config.outlineSize}pt ${config.outlineColor}`,
                              fontFamily: config.fontFamily || "sans-serif",
                              wordBreak: config.wordWrap
                                ? "break-word"
                                : "keep-all",
                              whiteSpace: config.wordWrap ? "normal" : "nowrap",
                              maxWidth: "100%",
                            }}
                          >
                            {text}
                          </div>
                        ))
                      : config.targetLanguages.map((lang) => (
                          <div
                            key={lang}
                            className="inline-block px-2 py-1 rounded"
                            style={{
                              fontSize: `${config.translatedSize}px`,
                              fontWeight: 900,
                              color: config.translatedColor,
                              textShadow: `0 0 ${config.outlineSize}pt ${config.outlineColor}`,
                              fontFamily: config.fontFamily || "sans-serif",
                              wordBreak: config.wordWrap
                                ? "break-word"
                                : "keep-all",
                              whiteSpace: config.wordWrap ? "normal" : "nowrap",
                              maxWidth: "100%",
                            }}
                          >
                            {`[${getLanguageLabel(lang)}] 翻譯示例`}
                          </div>
                        ))}
                  </div>

                  {isTesting && (
                    <div className="absolute top-2 right-2">
                      <Button
                        onClick={stopTest}
                        variant="destructive"
                        size="sm"
                      >
                        停止測試
                      </Button>
                    </div>
                  )}

                  {!isTesting && !recognizedText && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <p className="text-gray-400">
                        點擊「開始測試」按鈕開始語音辨識
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6 space-y-4">
              <h2 className="text-xl font-semibold">生成 Widget 網址</h2>

              <Button onClick={generateWidgetUrl} className="w-full">
                生成 Widget 網址
              </Button>

              {widgetUrl && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Widget 網址</label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(widgetUrl);
                        toast.success("已複製到剪貼簿");
                      }}
                    >
                      複製
                    </Button>
                  </div>
                  <Input value={widgetUrl} readOnly />
                  <p className="text-sm text-gray-500">
                    將此網址添加為 OBS 中的瀏覽器來源，建議寬度 1280px，高度
                    720px
                  </p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">使用說明</h2>
              <div className="space-y-2 text-gray-600">
                <p>1. 設定來源語言和目標語言</p>
                <p>2. 調整顯示設定，包括字體大小、顏色和位置</p>
                <p>3. 點擊「開始測試」按鈕測試翻譯效果</p>
                <p>4. 生成 Widget 網址並複製到 OBS 中作為瀏覽器來源</p>
                <p>5. 您可以儲存多個預設值以便快速切換不同的設定</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// 為 TypeScript 添加全局聲明
declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}
