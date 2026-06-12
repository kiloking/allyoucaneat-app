import { useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useChannelSettings } from "@/hooks/useChannelSettings";

const STEPS = [
  {
    icon: "📺",
    title: "輸入頻道 ID",
    description: "輸入你的 Twitch 頻道 ID,按「新增」產生專屬點歌頁面",
  },
  {
    icon: "🔗",
    title: "觀眾貼連結",
    description: "觀眾在聊天室貼上 YouTube、Suno、X 等連結,自動收集分類",
  },
  {
    icon: "🎵",
    title: "一起觀賞",
    description: "用 OBS 擷取點歌頁面畫面,和觀眾一起聽歌看片",
  },
];

export default function SongRequestEntry() {
  const router = useRouter();
  const { channelName, setChannelName } = useChannelSettings();
  const [channelInput, setChannelInput] = useState(channelName);

  const handleCreate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const channel = channelInput.trim().toLowerCase();
    if (!channel) {
      toast.error("請輸入頻道 ID");
      return;
    }
    setChannelName(channel);
    router.push(`/song-request/${channel}`);
  };

  return (
    <>
      <Head>
        <title>觀眾點歌 - 圖奇喵直播助理</title>
      </Head>
      <div className="min-h-[calc(100vh-200px)] bg-gradient-to-b from-purple-50 to-white">
        <div className="max-w-3xl mx-auto px-4 py-16 space-y-10">
          <div className="text-center space-y-3">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              🎵 觀眾點歌
            </h1>
            <p className="text-gray-600">
              自動收集聊天室裡觀眾貼的連結,免登入、免安裝,和觀眾一起聽歌看片
            </p>
          </div>

          <form
            onSubmit={handleCreate}
            className="bg-white rounded-xl shadow p-6 flex flex-col md:flex-row gap-3"
          >
            <Input
              placeholder="輸入你的 Twitch 頻道 ID,例如:dada6621"
              value={channelInput}
              onChange={(event) => setChannelInput(event.target.value)}
              className="flex-1"
            />
            <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
              新增點歌頁面
            </Button>
          </form>

          <div className="grid md:grid-cols-3 gap-4">
            {STEPS.map((step) => (
              <div
                key={step.title}
                className="bg-white rounded-xl shadow p-5 space-y-2"
              >
                <div className="text-3xl">{step.icon}</div>
                <h2 className="font-semibold text-gray-900">{step.title}</h2>
                <p className="text-sm text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded text-sm text-blue-700">
            💡 支援的播放來源:YouTube、YouTube Music、Suno、Spotify、X(Twitter)、Twitch
            剪輯。其他一般網頁連結會另外歸類在「一般連結」區。
          </div>
        </div>
      </div>
    </>
  );
}
