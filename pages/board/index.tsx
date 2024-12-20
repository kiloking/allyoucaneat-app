import { ContentLayout } from "@/components/admin-panel/content-layout";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { trpc } from "@/utils/trpc";

interface TwitchChannelData {
  total_followers: number;
  broadcaster_name?: string;
  broadcaster_language?: string;
  stream_title?: string;
  game_name?: string;
  tags?: string[];
}

export default function Dashboard() {
  const { data: session } = useSession();
  const [channelData, setChannelData] = useState<TwitchChannelData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const { data: followersData, isLoading } =
    trpc.twitch.getChannelFollowers.useQuery();

  useEffect(() => {
    if (session) {
      fetchTwitchChannelData(
        session?.token.providerAccountId,
        session?.token.access_token
      );
    }
  }, [session]);

  const fetchTwitchChannelData = async (
    userId: number,
    accessToken: string
  ) => {
    const TWITCH_URL_API = "https://api.twitch.tv/helix";
    try {
      // 獲取追隨者數據
      const followersResponse = await fetch(
        `${TWITCH_URL_API}/channels/followers?broadcaster_id=${userId}`,
        {
          headers: {
            "Client-ID": process.env.NEXT_PUBLIC_CLIENT_ID!,
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      // 獲取頻道資訊
      const channelResponse = await fetch(
        `${TWITCH_URL_API}/channels?broadcaster_id=${userId}`,
        {
          headers: {
            "Client-ID": process.env.NEXT_PUBLIC_CLIENT_ID!,
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!followersResponse.ok || !channelResponse.ok) {
        throw new Error("Failed to fetch Twitch data");
      }

      const followersData = await followersResponse.json();
      const channelInfo = await channelResponse.json();

      setChannelData({
        total_followers: followersData.total,
        ...channelInfo.data[0],
      });
    } catch (error) {
      console.error("Error fetching channel data:", error);
    } finally {
      setLoading(false);
    }
  };

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
          ) : channelData ? (
            <div className="bg-white p-6 rounded-lg shadow space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                頻道數據資訊
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-500">追隨者數量</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {channelData.total_followers.toLocaleString()}
                  </p>
                </div>
                {channelData.broadcaster_name && (
                  <div className="p-4 bg-gray-50 rounded-md">
                    <p className="text-sm text-gray-500">實況主名稱</p>
                    <p className="text-lg font-semibold">
                      {channelData.broadcaster_name}
                    </p>
                  </div>
                )}
                {channelData.game_name && (
                  <div className="p-4 bg-gray-50 rounded-md">
                    <p className="text-sm text-gray-500">目前遊戲分類</p>
                    <p className="text-lg font-semibold">
                      {channelData.game_name}
                    </p>
                  </div>
                )}
              </div>
              {channelData.stream_title && (
                <div className="mt-4">
                  <p className="text-sm text-gray-500">實況標題</p>
                  <p className="text-lg">{channelData.stream_title}</p>
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
