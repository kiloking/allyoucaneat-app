import type { NextApiRequest, NextApiResponse } from "next";

type ResponseData = {
  access_token?: string;
  message?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  // 只允許 GET 請求
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // 檢查必要的環境變數
    if (
      !process.env.NEXT_PUBLIC_CLIENT_ID ||
      !process.env.TWITCH_CLIENT_SECRET
    ) {
      throw new Error("Missing required environment variables");
    }

    // 獲取 Twitch App Access Token
    const tokenResponse = await fetch("https://id.twitch.tv/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.NEXT_PUBLIC_CLIENT_ID,
        client_secret: process.env.TWITCH_CLIENT_SECRET,
        grant_type: "client_credentials",
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.json();
      console.error("Twitch API Error:", error);
      throw new Error("Failed to get access token from Twitch");
    }

    const data = await tokenResponse.json();

    // 返回 access token
    return res.status(200).json({
      access_token: data.access_token,
    });
  } catch (error) {
    console.error("Server Error:", error);
    return res.status(500).json({
      message: error instanceof Error ? error.message : "Internal server error",
    });
  }
}
