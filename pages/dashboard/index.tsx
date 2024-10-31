import { ContentLayout } from "@/components/admin-panel/content-layout";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { trpc } from "@/utils/trpc";
export default function Dashboard() {
  const { data: session } = useSession();
  const [channelData, setChannelData] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { data, isLoading, error } = trpc.twitch.getChannelFollowers.useQuery();

  useEffect(() => {
    if (session) {
      // 解析 session 的資料

      fetchTwitchChannelData(
        session?.token.providerAccountId,
        session?.token.access_token
      );
    }
  }, [session]);

  // 呼叫 Twitch API 來獲取頻道數據
  const fetchTwitchChannelData = async (
    userId: number,
    accessToken: string,
    after: string = "",
    follows: any = []
  ) => {
    const TWITCH_URL_API = "https://api.twitch.tv/helix";
    try {
      const response = await fetch(
        `${TWITCH_URL_API}/channels/followers?broadcaster_id=${userId}`,
        {
          headers: {
            "Client-ID": process.env.NEXT_PUBLIC_CLIENT_ID!,
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch Twitch channel data");
      }

      const data = await response.json();
      console.log(data);
      setChannelData(data.total); // 假設你只需要一個頻道的數據
    } catch (error) {
      console.error("Error fetching channel data:", error);
    } finally {
      setLoading(false);
    }
  };
  return (
    <DashboardLayout>
      <ContentLayout title="Dashboard">
        <p>
          Tip1: 若要使用聊天室通知功能的主播請先到功能設定頁面
          XXXbot開啟加入到聊天室
        </p>
        <br />
        {loading ? (
          <p>正在獲取頻道數據...</p>
        ) : channelData ? (
          <div>
            <h3>目前登入的頻道數據資訊：</h3>
            <p>追隨數量: {channelData}</p>
            {/* 你可以根據 API 回應顯示其他資訊 */}
          </div>
        ) : (
          <p>無法獲取頻道數據。</p>
        )}
      </ContentLayout>
    </DashboardLayout>
  );
}
