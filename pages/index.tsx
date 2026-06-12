import Image from "next/image";
import { Inter } from "next/font/google";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/router";
import Link from "next/link";
import { useMemo, useState } from "react";
import { FLOATING_WORDS, navigation, onlineFeatures } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import { useChannelSettings } from "@/hooks/useChannelSettings";
const inter = Inter({ subsets: ["latin"] });

// 獲取所有分類
const categories = [
  "全部",
  ...Array.from(new Set(onlineFeatures.map((item) => item.category))),
];

export default function Home() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState("全部");
  const { channelName, setChannelName } = useChannelSettings();
  const [channelInput, setChannelInput] = useState(channelName);

  // 處理分類選擇
  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
  };

  // 過濾工具
  const filteredFeatures = useMemo(
    () =>
      onlineFeatures.filter((item) =>
        selectedCategory === "全部" ? true : item.category === selectedCategory
      ),
    [selectedCategory]
  );

  const handleStart = async () => {
    if (channelInput.trim()) {
      setChannelName(channelInput.trim());
    }
    router.push("/board");
  };

  return (
    <div className={`${inter.className}`}>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-purple-600 to-blue-600 text-white relative overflow-hidden">
        {/* 浮動文字背景 */}
        <div className="absolute inset-0 opacity-10">
          {FLOATING_WORDS.map((word, index) => (
            <div
              key={index}
              className="absolute animate-float whitespace-nowrap"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                fontSize: `${Math.random() * 20 + 14}px`,
              }}
            >
              {word}
            </div>
          ))}
        </div>

        <div className="container mx-auto px-6 py-20 relative z-0">
          <div className="flex flex-col lg:flex-row items-center">
            <div className="lg:w-1/2 space-y-8">
              <div className="space-y-4">
                <span className="text-xl font-medium bg-white/20 px-4 py-1 rounded-full ">
                  TwitchMeow 圖奇喵助理
                </span>
                <h1 className="text-4xl lg:text-6xl font-bold ">
                  Twitch 實況主的最佳助手
                </h1>
              </div>
              <p className="text-xl">
                提供多樣化的 Widgets 可以幫助您提升觀眾互動體驗
              </p>
              <div className="bg-white/10 backdrop-blur rounded-xl p-4 space-y-3 max-w-lg">
                <label className="text-sm font-medium tracking-wide">
                  先輸入你的 Twitch 頻道名稱，所有工具將自動套用
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input
                    value={channelInput}
                    onChange={(event) => setChannelInput(event.target.value)}
                    placeholder="例如：dada6621"
                    className="bg-white text-gray-900"
                  />
                  <Button onClick={handleStart} className="sm:w-auto">
                    開始設定
                  </Button>
                </div>
                <p className="text-sm text-white/70">
                  我們會將頻道名稱保存於瀏覽器，無需登入也能快速使用。
                </p>
              </div>
            </div>
            <div className="lg:w-1/2 mt-10 lg:mt-0 relative group">
              <video
                src="https://web.forestdev.work/sideproject1/cat02.mp4"
                poster="https://web.forestdev.work/sideproject1/cat01.png"
                width={600}
                height={400}
                className="rounded-lg shadow-xl w-full"
                loop
                muted
                playsInline
                onMouseEnter={(e) => e.currentTarget.play()}
                onMouseLeave={(e) => {
                  e.currentTarget.pause();
                  e.currentTarget.currentTime = 0;
                }}
              />
            </div>
          </div>
        </div>
      </section>
      {/* 已上線 */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-16">已上線功能</h2>
          {/* 工具分類標籤 */}
          <div className="flex flex-wrap gap-2 mb-8 justify-center">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => handleCategorySelect(category)}
                className={`px-4 py-2 rounded-full transition-colors ${
                  selectedCategory === category
                    ? "bg-purple-500 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-100"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* 工具搜索框 */}
          <div className="mb-8 max-w-md mx-auto">
            <input
              type="text"
              placeholder="搜尋工具..."
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredFeatures.map((item, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 group relative overflow-hidden border border-gray-100"
              >
                {/* 工具標籤 */}
                <div className="absolute top-4 right-4 bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                  {item.category || "通用"}
                </div>

                {/* 工具圖片 */}
                <div className="relative overflow-hidden rounded-lg mb-4">
                  <Image
                    src={item.image}
                    alt={item.name}
                    width={600}
                    height={400}
                    className="w-full h-48 object-cover rounded-lg transform group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                </div>

                {/* 工具內容 */}
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-gray-800">
                    {item.name}
                  </h3>
                  <p className="text-gray-600 min-h-[60px]">
                    {item.description}
                  </p>

                  {/* 使用統計 */}
                  <div className="flex items-center text-sm text-gray-500">
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                    <span>1234 次使用</span>
                  </div>

                  {/* 使用按鈕 */}
                  <Link
                    href={item.href}
                    className="inline-flex items-center justify-center w-full px-6 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 transition-all duration-300 shadow-md hover:shadow-lg"
                    target="_blank"
                  >
                    立即使用
                    <svg
                      className="ml-2 -mr-1 h-4 w-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* 開發中 Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-16">開發中功能</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "觀眾數據追蹤",
                description: "即時掌握觀眾、訂閱者動態",
                icon: "📊",
              },

              {
                title: "自動回應機器人",
                description: "自動回應觀眾留言，增加互動性",
                icon: "🤖",
              },
              {
                title: "歐付寶斗內條",
                description: "結合歐付寶設定目標斗內目標",
                icon: "🤖",
              },

              {
                title: "一鍵整合",
                description: "簡單設定，快速串接 Twitch 帳號",
                icon: "🔌",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
