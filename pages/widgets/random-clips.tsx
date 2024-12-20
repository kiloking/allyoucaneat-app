import { useEffect, useState } from "react";
import { useRouter } from "next/router";

interface Clip {
  id: string;
  url: string;
  embed_url: string;
  title: string;
  creator_name: string;
  created_at: string;
}

export default function RandomClipsWidget() {
  const router = useRouter();
  const [currentClip, setCurrentClip] = useState<Clip | null>(null);
  const [showOverlay, setShowOverlay] = useState(true);

  useEffect(() => {
    if (!router.isReady) return;

    const { channel, mode, range, length, volume, overlay, timer, category } =
      router.query;

    // 這裡實現獲取 clips 的邏輯
    // 根據參數調用 Twitch API
  }, [router.isReady, router.query]);

  if (!currentClip) {
    return <div>Loading...</div>;
  }

  return (
    <div className="relative w-full h-screen">
      <iframe
        src={`https://clips.twitch.tv/embed?clip=${currentClip.id}&parent=${window.location.hostname}`}
        width="100%"
        height="100%"
        allowFullScreen
      />
      {showOverlay && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-white">
          <h3 className="text-lg font-bold">{currentClip.title}</h3>
          <p className="text-sm">
            由 {currentClip.creator_name} 建立於{" "}
            {new Date(currentClip.created_at).toLocaleDateString()}
          </p>
        </div>
      )}
    </div>
  );
}
