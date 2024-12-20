interface Feature {
  name: string;
  href: string;
  description: string;
  icon: string;
  image: string;
}

export const navigation = [
  {
    name: "首頁",
    href: "/",
    active: true,
  },
  {
    name: "功能",
    items: [
      {
        name: "剪輯播放器 ",
        href: "/clips-manager",
        description: "隨選剪輯嵌入OBS並自動播放，提升頻道曝光",
        icon: "🎬",
        image: "https://web.forestdev.work/sideproject1/cat02.png",
      },
      {
        name: "聊天室語音朗讀",
        href: "/chat",
        description: "自動將觀眾留言轉為語音，不錯過任何互動",
        icon: "🎯",
        image: "https://web.forestdev.work/sideproject1/cat04.png",
      },
      // 可以在這裡添加更多功能選項
    ],
    active: false,
  },
  {
    name: "價格",
    href: "/pricing",
    active: false,
  },
  {
    name: "關於我們",
    href: "/about",
    active: false,
  },
];

// 已上線功能 get navigation.name:功能 items
export const onlineFeatures: Feature[] = navigation
  .map((item) => item.items)
  .flat()
  .filter((item): item is Feature => item !== undefined);

export const FLOATING_WORDS = [
  "直播",
  "實況",
  "剪輯",
  "Widget",
  "互動",
  "觀眾",
  "Twitch",
  "遊戲",
  "聊天",
  "社群",
  "串流",
  "主播",
  "訂閱",
  "追隨者",
  "表情符號",
  "Discord",
  "粉絲團",
  "點閱率",
  "收益",
  "贊助",
  "小奇點",
  "禮物訂閱",
  "MOD",
  "版主",
  "通知",
  "上線提醒",
  "影片時長",
  "觀眾人數",
  "熱門分類",
  "實況排程",
  "轉播",
  "延遲時間",
  "畫質設定",
  "OBS",
  "嵌入",
  "自動",
  "播放",
  "乾爹",
  "睡覺台",
  "泳池台",
  "加班台",
  "輪椅台",
  "無障礙",
];
