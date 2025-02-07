import { ContentLayout } from "@/components/admin-panel/content-layout";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { trpc } from "@/utils/trpc";

interface TwitchChannelData {
  total_followers: number;
  broadcaster_name?: string;
  game_name?: string;
  title?: string;
}

export default function Dashboard() {
  const [twitchChannelData, setTwitchChannelData] =
    useState<TwitchChannelData | null>(null);
  const [loading, setLoading] = useState(true);
  const { data, isLoading } = trpc.twitch.getChannelFollowers.useQuery();

  useEffect(() => {
    if (data) {
      setTwitchChannelData(data);
      setLoading(false);
    }
  }, [data]);

  return (
    <DashboardLayout>
      <ContentLayout title="Dashboard">
        <div className="space-y-6">
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <p className="text-yellow-700">
              Tip1: 若要使用聊天室通知功能的主播請先到功能設定頁面
              XXXbot開啟加入到聊天室
            </p>
          </div>

          {loading ? (
            <div className="animate-pulse bg-white p-6 rounded-lg shadow">
              <p>正在獲取頻道數據...</p>
            </div>
          ) : twitchChannelData ? (
            <div className="bg-white p-6 rounded-lg shadow space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                頻道數據資訊
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-500">追隨者數量</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {twitchChannelData.total_followers.toLocaleString()}
                  </p>
                </div>
                {twitchChannelData.broadcaster_name && (
                  <div className="p-4 bg-gray-50 rounded-md">
                    <p className="text-sm text-gray-500">實況主名稱</p>
                    <p className="text-lg font-semibold">
                      {twitchChannelData.broadcaster_name}
                    </p>
                  </div>
                )}
                {twitchChannelData.game_name && (
                  <div className="p-4 bg-gray-50 rounded-md">
                    <p className="text-sm text-gray-500">目前遊戲分類</p>
                    <p className="text-lg font-semibold">
                      {twitchChannelData.game_name}
                    </p>
                  </div>
                )}
              </div>
              {twitchChannelData.title && (
                <div className="mt-4">
                  <p className="text-sm text-gray-500">實況標題</p>
                  <p className="text-lg">{twitchChannelData.title}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-red-50 border-l-4 border-red-400 p-4">
              <p className="text-red-700">無法獲取頻道數據。</p>
            </div>
          )}
        </div>
      </ContentLayout>
    </DashboardLayout>
  );
}
