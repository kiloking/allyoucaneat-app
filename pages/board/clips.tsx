import { ContentLayout } from "@/components/admin-panel/content-layout";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";

interface Clip {
  id: string;
  url: string;
  embed_url: string;
  broadcaster_id: string;
  broadcaster_name: string;
  creator_id: string;
  creator_name: string;
  video_id: string;
  game_id: string;
  language: string;
  title: string;
  view_count: number;
  created_at: string;
  thumbnail_url: string;
  duration: number;
}

export default function ClipsPage() {
  const { data: session } = useSession();
  const [clips, setClips] = useState<Clip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session) {
      fetchClips();
    }
  }, [session]);

  const fetchClips = async () => {
    try {
      const response = await fetch(
        `https://api.twitch.tv/helix/clips?broadcaster_id=${session?.token.providerAccountId}`,
        {
          headers: {
            "Client-ID": process.env.NEXT_PUBLIC_CLIENT_ID!,
            Authorization: `Bearer ${session?.token.access_token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch clips");
      }

      const data = await response.json();
      setClips(data.data);
    } catch (error) {
      console.error("Error fetching clips:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <ContentLayout title="精華片段管理">
        {loading ? (
          <div className="flex justify-center items-center min-h-[200px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">我的剪輯影片</h2>
              <button
                onClick={fetchClips}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
              >
                重新整理
              </button>
            </div>

            {clips.length === 0 ? (
              <div className="text-center py-10 bg-gray-50 rounded-lg">
                <p className="text-gray-500">目前還沒有剪輯影片</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {clips.map((clip) => (
                  <div
                    key={clip.id}
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <div className="relative pb-[56.25%]">
                      <img
                        src={clip.thumbnail_url}
                        alt={clip.title}
                        className="absolute top-0 left-0 w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-4 space-y-2">
                      <h3 className="font-semibold text-lg line-clamp-2">
                        {clip.title}
                      </h3>
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>
                          觀看次數: {clip.view_count.toLocaleString()}
                        </span>
                        <span>
                          {new Date(clip.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-2">
                        <span className="text-sm text-gray-500">
                          由 {clip.creator_name} 建立
                        </span>
                        <a
                          href={clip.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 bg-purple-100 text-purple-600 rounded-full text-sm hover:bg-purple-200 transition-colors"
                        >
                          觀看影片
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </ContentLayout>
    </DashboardLayout>
  );
}
