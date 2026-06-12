import { ContentLayout } from "@/components/admin-panel/content-layout";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useState, useEffect } from "react";
import { useChannelSettings } from "@/hooks/useChannelSettings";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { MessageSquare } from "lucide-react";
import Link from "next/link";

export default function Dashboard() {
  const { channelName, setChannelName } = useChannelSettings();
  const [channelInput, setChannelInput] = useState(channelName);

  useEffect(() => {
    setChannelInput(channelName);
  }, [channelName]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!channelInput.trim()) {
      toast.error("請輸入頻道名稱");
      return;
    }
    setChannelName(channelInput.trim());
    toast.success("頻道名稱已儲存");
  };

  return (
    <DashboardLayout>
      <ContentLayout title="Dashboard">
        <div className="space-y-6">
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
            <p className="text-blue-700 text-sm">
              💡 提示：設定頻道名稱後，所有功能都會自動使用此頻道名稱。
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">頻道設定</h2>
            <form className="space-y-3" onSubmit={handleSubmit}>
              <label className="text-sm font-medium text-gray-700">
                我的 Twitch 頻道名稱
              </label>
              <div className="flex flex-col md:flex-row gap-3">
                <Input
                  placeholder="例如：dada6621"
                  value={channelInput}
                  onChange={(event) => setChannelInput(event.target.value)}
                  className="md:max-w-sm"
                />
                <Button type="submit" className="md:w-auto">
                  儲存
                </Button>
              </div>
              <p className="text-sm text-gray-500">
                頻道名稱會保存於瀏覽器本地，下次造訪可直接使用。
              </p>
            </form>
            {channelName && (
              <div className="mt-4 p-3 bg-green-50 rounded border border-green-200">
                <p className="text-sm text-green-700">
                  ✓ 目前設定：
                  <span className="font-semibold">{channelName}</span>
                </p>
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              可用功能
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/board/chat">
                <div className="p-4 border rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-8 w-8 text-purple-600" />
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        聊天室語音朗讀
                      </h3>
                      <p className="text-sm text-gray-500">
                        自動將觀眾留言轉為語音
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </ContentLayout>
    </DashboardLayout>
  );
}
