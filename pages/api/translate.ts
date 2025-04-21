import { NextApiRequest, NextApiResponse } from "next";

const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzvxY5f53sOdBnaZjIqkMI8mdKhpdX75WKgFsTalokL7V05eGgIYpUqxZ155qblIFfB/exec";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "只接受 POST 請求" });
  }

  try {
    const { text, target } = req.body;

    if (!text || !target) {
      return res.status(400).json({ message: "缺少必要參數" });
    }

    // 使用 Google Apps Script 進行翻譯
    const response = await fetch(
      `${GOOGLE_SCRIPT_URL}?text=${encodeURIComponent(
        text
      )}&source=zh-TW&target=${target}`
    );

    if (!response.ok) {
      throw new Error("翻譯請求失敗");
    }

    const translatedText = await response.text();
    return res.status(200).json({ translatedText });
  } catch (error) {
    console.error("翻譯錯誤:", error);
    return res.status(500).json({
      message: "翻譯服務發生錯誤",
      error: error instanceof Error ? error.message : "未知錯誤",
    });
  }
}
