import { ContentLayout } from "@/components/admin-panel/content-layout";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

interface Clip {
  id: string;
  url: string;
  embed_url: string;
  title: string;
  thumbnail_url: string;
  view_count: number;
  created_at: string;
  creator_name: string;
}

export default function ClipsManager() {
  const { data: session } = useSession();
  const [allClips, setAllClips] = useState<Clip[]>([]);
  const [selectedClips, setSelectedClips] = useState<Clip[]>([]);
  const [loading, setLoading] = useState(true);
  const [widgetUrl, setWidgetUrl] = useState("");

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

      if (!response.ok) throw new Error("Failed to fetch clips");
      const data = await response.json();
      setAllClips(data.data);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClipSelect = (clip: Clip) => {
    if (selectedClips.length >= 10) {
      alert("最多只能選擇10個片段");
      return;
    }
    if (!selectedClips.find((c) => c.id === clip.id)) {
      setSelectedClips([...selectedClips, clip]);
    }
  };

  const handleClipRemove = (clipId: string) => {
    setSelectedClips(selectedClips.filter((clip) => clip.id !== clipId));
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(selectedClips);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setSelectedClips(items);
  };

  const generateWidgetUrl = () => {
    const clipIds = selectedClips.map((clip) => clip.id).join(",");
    const url = `${window.location.origin}/widgets/clips?clips=${clipIds}`;
    setWidgetUrl(url);
  };

  return (
    <DashboardLayout>
      <ContentLayout title="精華段輪播管理">
        <div className="space-y-6">
          {/* 已選擇的片段 */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">
              已選擇的片段 ({selectedClips.length}/10)
            </h2>
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="selected-clips">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-2"
                  >
                    {selectedClips.map((clip, index) => (
                      <Draggable
                        key={clip.id}
                        draggableId={clip.id}
                        index={index}
                      >
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="flex items-center justify-between bg-gray-50 p-3 rounded"
                          >
                            <div className="flex items-center space-x-3">
                              <img
                                src={clip.thumbnail_url}
                                alt={clip.title}
                                className="w-20 h-12 object-cover rounded"
                              />
                              <span className="font-medium">{clip.title}</span>
                            </div>
                            <button
                              onClick={() => handleClipRemove(clip.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              移除
                            </button>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>

            {selectedClips.length > 0 && (
              <div className="mt-4">
                <button
                  onClick={generateWidgetUrl}
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                >
                  生成 Widget 網址
                </button>
                {widgetUrl && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-600 mb-2">Widget 網址：</p>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={widgetUrl}
                        readOnly
                        className="flex-1 p-2 border rounded"
                      />
                      <button
                        onClick={() => navigator.clipboard.writeText(widgetUrl)}
                        className="px-3 py-2 bg-gray-100 rounded hover:bg-gray-200"
                      >
                        複製
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 所有可選擇的片段 */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">可選擇的片段</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allClips.map((clip) => (
                <div
                  key={clip.id}
                  className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <img
                    src={clip.thumbnail_url}
                    alt={clip.title}
                    className="w-full h-32 object-cover"
                  />
                  <div className="p-3">
                    <h3 className="font-medium line-clamp-2">{clip.title}</h3>
                    <div className="mt-2 flex justify-between items-center">
                      <span className="text-sm text-gray-500">
                        觀看次數: {clip.view_count}
                      </span>
                      <button
                        onClick={() => handleClipSelect(clip)}
                        disabled={!!selectedClips.find((c) => c.id === clip.id)}
                        className="px-3 py-1 bg-purple-100 text-purple-600 rounded-full text-sm hover:bg-purple-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {selectedClips.find((c) => c.id === clip.id)
                          ? "已選擇"
                          : "選擇"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ContentLayout>
    </DashboardLayout>
  );
}
