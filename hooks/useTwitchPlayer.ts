import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';

// Define the Twitch Player and related events for type safety
declare global {
  interface Window {
    Twitch: any;
  }
}

interface TwitchPlayer {
  destroy: () => void;
  addEventListener: (event: string, callback: () => void) => void;
  setVolume: (volume: number) => void;
  getVolume: () => number;
  // Add other player methods as needed
}

const PLAYER_EVENT = {
  ENDED: 'ended',
  READY: 'ready',
};

export function useTwitchPlayer(initialVolume: number) {
  const [previewClips, setPreviewClips] = useState<any[]>([]);
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const playerRef = useRef<TwitchPlayer | null>(null);

  const handleNextClip = () => {
    setCurrentPreviewIndex((prev) =>
      prev < previewClips.length - 1 ? prev + 1 : 0
    );
  };

  // Effect to initialize the Twitch Player script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://player.twitch.tv/js/embed/v1.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      playerRef.current?.destroy();
    };
  }, []);

  // Effect to initialize or update the player when clips change
  useEffect(() => {
    if (previewClips.length > 0 && window.Twitch) {
      const clip = previewClips[currentPreviewIndex];
      if (!clip) return;

      // Destroy previous instance if it exists
      playerRef.current?.destroy();

      const options = {
        width: '100%',
        height: '100%',
        clip: clip.id, // Use clip ID for robust playback
        parent: [window.location.hostname],
        autoplay: true,
        muted: false,
      };

      const player = new window.Twitch.Player('twitch-player', options);
      playerRef.current = player;

      player.addEventListener(PLAYER_EVENT.READY, () => {
        player.setVolume(initialVolume / 100);
      });

      if (isAutoPlaying) {
        player.addEventListener(PLAYER_EVENT.ENDED, handleNextClip);
      }
    }
  }, [currentPreviewIndex, previewClips, isAutoPlaying, initialVolume]);

  return {
    previewClips,
    setPreviewClips,
    currentPreviewIndex,
    setCurrentPreviewIndex,
    isAutoPlaying,
    setIsAutoPlaying,
    handleNextClip,
  };
}
