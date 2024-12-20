import Image from "next/image";
import { Inter } from "next/font/google";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/router";
import { signIn, useSession } from "next-auth/react";
import Link from "next/link";
import { FLOATING_WORDS, navigation, onlineFeatures } from "@/lib/constants";
const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  const router = useRouter();
  const { data: session } = useSession();

  const handleStart = async () => {
    if (!session) {
      // 如果用戶未登入，先進行 Twitch 登入
      await signIn("twitch", {
        callbackUrl: "/board", // 登入成功後導向 /board
      });
    } else {
      // 如果已登入，直接導向 /board
      router.push("/board");
    }
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
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {onlineFeatures.map((item, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-lg shadow-md hover:bg-gray-100 transition-colors duration-300"
              >
                <div className="text-4xl mb-4">
                  <Image
                    src={item.image}
                    alt={item.name}
                    width={600}
                    height={100}
                    className="rounded-lg shadow-xl w-full"
                  />
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.name}</h3>
                <p className="text-gray-600">{item.description}</p>
                <Link
                  href={item.href}
                  className="text-zinc-800/80 border border-zinc-800/50 rounded-md px-4 py-2 mt-4 w-full flex justify-center items-center hover:border-zinc-900 transition-colors duration-300 hover:bg-gradient-to-r from-purple-400/20  to-blue-400/20 shadow-md "
                  target="_blank"
                >
                  前往頁面{" "}
                </Link>
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
