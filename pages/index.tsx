import Image from "next/image";
import { Inter } from "next/font/google";
import { Button } from "@/components/ui/button";
const inter = Inter({ subsets: ["latin"] });

// 關於twitch實況主工具的頁面 是一套saas服務
// 使用者登入後可以在使用者管理頁面儲存twitch Key 來協助驅動工具執行
// 工具一 可以抓取實況主的聊天室訊息：瀏覽器會語音朗讀
// 工具二 可以抓取實況主在twitch的觀看者清單
// 工具三 可以抓取實況主在twitch的訂閱者清單
// 工具四 可以抓取實況主在twitch的精華影片
// 工具五 可以抓取實況主在twitch的剪輯影片：可以選擇剪輯影片的輪播數量
// 工具六 可以自定義聊天室的樣式用於OBS，他是一個web Overlay
// 側邊欄有 1. 使用者資訊
//

export default function Home() {
  return (
    <main
      className={`flex min-h-screen flex-col items-center justify-between p-24 ${inter.className}`}
    >
      <h1>Hello World</h1>
      <Button>Click me</Button>
    </main>
  );
}
