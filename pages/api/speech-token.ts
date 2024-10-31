import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "只允許 POST 請求" });
  }

  const authToken = req.headers.authorization?.replace("Bearer ", "");

  if (!authToken || authToken !== process.env.API_AUTH_TOKEN) {
    return res.status(401).json({ message: "未授權的請求" });
  }

  try {
    // 回傳語音設定
    res.status(200).json({
      key: process.env.AZURE_SPEECH_KEY,
      region: process.env.AZURE_SPEECH_REGION,
    });
  } catch (error) {
    console.error("取得語音設定失敗:", error);
    res.status(500).json({ message: "取得語音設定失敗" });
  }
}
