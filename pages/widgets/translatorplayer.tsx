import { useState, useEffect, useRef } from "react";
import Head from "next/head";
import { useRouter } from "next/router";

export default function TranslatorPlayer() {
  const router = useRouter();
  const [config, setConfig] = useState({
    source: "zh-TW",
    targets: ["en", "ja"],
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

  const [recognizedText, setRecognizedText] = useState("");
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const recognitionRef = useRef<any>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 從 URL 參數讀取設定
  useEffect(() => {
    if (router.isReady) {
      const {
        source,
        targets,
        showOriginal,
        originalSize,
        translatedSize,
        originalColor,
        translatedColor,
        outlineColor,
        outlineSize,
        backgroundColor,
        textPosition,
        wordWrap,
        clearTimeout,
        fontFamily,
      } = router.query;

      const newConfig = { ...config };

      if (source) newConfig.source = source as string;
      if (targets) newConfig.targets = (targets as string).split(",");
      if (showOriginal) newConfig.showOriginal = showOriginal === "true";
      if (originalSize)
        newConfig.originalSize = parseInt(originalSize as string);
      if (translatedSize)
        newConfig.translatedSize = parseInt(translatedSize as string);
      if (originalColor)
        newConfig.originalColor = decodeURIComponent(originalColor as string);
      if (translatedColor)
        newConfig.translatedColor = decodeURIComponent(
          translatedColor as string
        );
      if (outlineColor)
        newConfig.outlineColor = decodeURIComponent(outlineColor as string);
      if (outlineSize) newConfig.outlineSize = parseInt(outlineSize as string);
      if (backgroundColor)
        newConfig.backgroundColor = decodeURIComponent(
          backgroundColor as string
        );
      if (textPosition) newConfig.textPosition = textPosition as string;
      if (wordWrap) newConfig.wordWrap = wordWrap === "true";
      if (clearTimeout)
        newConfig.clearTimeout = parseInt(clearTimeout as string);
      if (fontFamily)
        newConfig.fontFamily = decodeURIComponent(fontFamily as string);

      setConfig(newConfig);

      // 初始化語音辨識
      initSpeechRecognition(newConfig);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [router.isReady, router.query]);

  // 初始化語音辨識
  const initSpeechRecognition = (cfg: typeof config) => {
    if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
      console.error("瀏覽器不支援語音辨識");
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = getLangCode(cfg.source);

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

        // 清除之前的超時
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        // 模擬翻譯 (實際應用中應調用翻譯 API)
        const mockTranslations: Record<string, string> = {};
        for (const target of cfg.targets) {
          if (target !== cfg.source) {
            try {
              // 這裡應該調用實際的翻譯 API
              // 目前使用模擬翻譯
              mockTranslations[target] = await simulateTranslation(
                finalTranscript,
                cfg.source,
                target
              );
            } catch (error) {
              console.error(`翻譯到 ${target} 失敗:`, error);
              mockTranslations[target] = `[翻譯失敗]`;
            }
          }
        }

        setTranslations(mockTranslations);

        // 設定超時清除文字
        timeoutRef.current = setTimeout(() => {
          setRecognizedText("");
          setTranslations({});
        }, cfg.clearTimeout);
      } else if (interimTranscript) {
        setRecognizedText(interimTranscript);
      }
    };

    recognition.onend = () => {
      // 重新啟動辨識
      recognition.start();
    };

    recognition.onerror = (event: any) => {
      console.error("語音辨識錯誤:", event.error);
      // 嘗試重新啟動
      setTimeout(() => {
        recognition.start();
      }, 1000);
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
    } catch (error) {
      console.error("啟動語音辨識失敗:", error);
    }
  };

  // 模擬翻譯功能 (實際應用中應替換為真實的翻譯 API)
  const simulateTranslation = async (
    text: string,
    sourceLang: string,
    targetLang: string
  ): Promise<string> => {
    // 這裡應該調用實際的翻譯 API
    // 例如 Google Translate API 或 DeepL API

    // 模擬翻譯延遲
    await new Promise((resolve) => setTimeout(resolve, 300));

    // 簡單的模擬翻譯
    const langMap: Record<string, string> = {
      "zh-TW": "中文",
      en: "English",
      ja: "日本語",
      ko: "한국어",
      fr: "Français",
      de: "Deutsch",
      es: "Español",
      ru: "Русский",
    };

    return `[${langMap[targetLang] || targetLang}] ${text}`;
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

  // 獲取位置樣式
  const getPositionStyle = () => {
    switch (config.textPosition) {
      case "top":
        return "items-start";
      case "middle":
        return "items-center";
      default:
        return "items-end";
    }
  };

  return (
    <>
      <Head>
        <title>Twitch 翻譯機</title>
        <style jsx global>{`
          body {
            margin: 0;
            padding: 0;
            overflow: hidden;
          }

          @import url("https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;700;900&display=swap");
        `}</style>
      </Head>

      <div
        className={`min-h-screen flex flex-col ${getPositionStyle()} justify-center p-4`}
        style={{ backgroundColor: config.backgroundColor }}
      >
        <div className="w-full text-center space-y-2">
          {/* 原文 */}
          {config.showOriginal && recognizedText && (
            <div
              className="inline-block px-2 py-1 rounded"
              style={{
                fontSize: `${config.originalSize}px`,
                fontWeight: 900,
                color: config.originalColor,
                textShadow: `0 0 ${config.outlineSize}pt ${config.outlineColor}`,
                fontFamily: config.fontFamily || "sans-serif",
                wordBreak: config.wordWrap ? "break-word" : "keep-all",
                whiteSpace: config.wordWrap ? "normal" : "nowrap",
                maxWidth: "100%",
              }}
            >
              {recognizedText}
            </div>
          )}

          {/* 翻譯 */}
          {Object.entries(translations).map(([lang, text]) => (
            <div
              key={lang}
              className="inline-block px-2 py-1 rounded"
              style={{
                fontSize: `${config.translatedSize}px`,
                fontWeight: 900,
                color: config.translatedColor,
                textShadow: `0 0 ${config.outlineSize}pt ${config.outlineColor}`,
                fontFamily: config.fontFamily || "sans-serif",
                wordBreak: config.wordWrap ? "break-word" : "keep-all",
                whiteSpace: config.wordWrap ? "normal" : "nowrap",
                maxWidth: "100%",
              }}
            >
              {text}
            </div>
          ))}
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
