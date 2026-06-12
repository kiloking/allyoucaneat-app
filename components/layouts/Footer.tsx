import { useState, useEffect } from "react";

const Footer = () => {
  const [isLive, setIsLive] = useState(false);
  const channelName = "dada6621";

  useEffect(() => {
    const checkStreamStatus = async () => {
      try {
        const response = await fetch(
          `/api/twitch/stream-status?login=${encodeURIComponent(channelName)}`
        );
        const data = await response.json();

        if (!response.ok) {
          // 憑證失效等伺服器錯誤時靜默顯示 Offline,避免每次輪詢噴錯
          if (process.env.NODE_ENV === "development") {
            console.warn("直播狀態查詢失敗:", data.message ?? response.status);
          }
          setIsLive(false);
          return;
        }

        setIsLive(Boolean(data.isLive));
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.warn("檢查直播狀態時發生錯誤:", error);
        }
        setIsLive(false);
      }
    };

    checkStreamStatus();
    // 每 5 分鐘檢查一次直播狀態
    const interval = setInterval(checkStreamStatus, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <footer className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
      <div className="container mx-auto flex justify-end items-center gap-4">
        有空歡迎來聊天室聊天，
        <a
          href="https://www.twitch.tv/dada6621"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-purple-400 transition-colors flex items-center gap-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M2.149 0l-1.612 4.119v16.836h5.731v3.045h3.224l3.045-3.045h4.657l6.269-6.269v-14.686h-21.314zm19.164 13.612l-3.582 3.582h-5.731l-3.045 3.045v-3.045h-4.836v-15.045h17.194v11.463zm-3.582-7.343v6.262h-2.149v-6.262h2.149zm-5.731 0v6.262h-2.149v-6.262h2.149z" />
          </svg>
          妃寶寶{" "}
          {isLive ? (
            <span className="bg-red-800 text-white text-xs rounded-full px-2 py-1 ml-2">
              Live!
            </span>
          ) : (
            <span className="bg-blue-800 text-white text-xs rounded-full px-2 py-1 ml-2">
              Offline
            </span>
          )}
        </a>
      </div>
    </footer>
  );
};

export default Footer;
