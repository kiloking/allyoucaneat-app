import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function ClipsWidget() {
  const router = useRouter();
  const { clips } = router.query;
  const [currentClipIndex, setCurrentClipIndex] = useState(0);
  const [clipsList, setClipsList] = useState<string[]>([]);

  useEffect(() => {
    if (clips) {
      setClipsList((clips as string).split(","));
    }
  }, [clips]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentClipIndex((prev) =>
        prev === clipsList.length - 1 ? 0 : prev + 1
      );
    }, 300000); // 每5分鐘切換一次

    return () => clearInterval(interval);
  }, [clipsList.length]);

  if (!clips || clipsList.length === 0) {
    return <div>No clips selected</div>;
  }

  return (
    <div className="w-full h-screen bg-transparent">
      <iframe
        src={`https://clips.twitch.tv/embed?clip=${clipsList[currentClipIndex]}&parent=${window.location.hostname}`}
        width="100%"
        height="100%"
        allowFullScreen
      />
    </div>
  );
}
