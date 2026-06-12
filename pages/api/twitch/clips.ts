
import type { NextApiRequest, NextApiResponse } from "next";
import {
  fetchTwitch,
  getAppAccessToken,
  getTwitchUserByLogin,
} from "@/lib/twitchApi";

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
  vod_offset: number | null;
}

interface TwitchApiResponse {
  data: Clip[];
  pagination: {
    cursor?: string;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { channel, mode, range, length } = req.query;

  if (typeof channel !== "string" || !channel) {
    return res.status(400).json({ message: "Channel name is required" });
  }

  try {
    const accessToken = await getAppAccessToken();

    const user = await getTwitchUserByLogin(channel);
    const userId = user?.id;

    if (!userId) {
      return res.status(404).json({ message: "Twitch channel not found" });
    }

    // Build clips URL
    let clipsUrl = `https://api.twitch.tv/helix/clips?broadcaster_id=${userId}&first=50`;

    if (range && range !== "all") {
      const startDate = new Date();
      switch (range) {
        case "7d":
          startDate.setDate(startDate.getDate() - 7);
          break;
        case "30d":
          startDate.setDate(startDate.getDate() - 30);
          break;
        case "6m":
          startDate.setMonth(startDate.getMonth() - 6);
          break;
        case "1y":
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
      }
      clipsUrl += `&started_at=${startDate.toISOString()}`;
    }

    const clipsData = await fetchTwitch<TwitchApiResponse>(clipsUrl, accessToken);

    // Filter and sort clips
    let processedClips = clipsData.data;

    if (length) {
      processedClips = processedClips.filter(
        (clip) => clip.duration <= Number(length)
      );
    }

    if (mode === "top") {
      processedClips.sort((a, b) => b.view_count - a.view_count);
    } else {
      // Random mode
      processedClips.sort(() => Math.random() - 0.5);
    }

    res.status(200).json(processedClips.slice(0, 20)); // Return top 20 after processing

  } catch (error) {
    console.error("Internal Server Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
