import type { NextApiRequest, NextApiResponse } from "next";
import { isChannelLive } from "@/lib/twitchApi";

type ResponseData = {
  isLive?: boolean;
  message?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const login =
    typeof req.query.login === "string" ? req.query.login.trim() : "";
  if (!login) {
    return res.status(400).json({ message: "缺少 login 參數" });
  }

  try {
    const isLive = await isChannelLive(login);
    return res.status(200).json({ isLive });
  } catch (error) {
    console.error("stream-status error:", error);
    return res.status(500).json({
      message:
        error instanceof Error ? error.message : "無法取得直播狀態",
    });
  }
}
