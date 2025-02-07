import { z } from "zod";
export const UpdateOpaySettingsSchema = z.object({
  opayId: z.string().default(""),
  merchantId: z.string(),
  hashKey: z.string(),
  hashIV: z.string(),
  enabled: z.boolean(),
  minAmount: z.number().min(1).default(10),
  channelUrl: z.string().default(""),

  // 通知設定
  alertSound: z.string().url().optional(),
  alertImage: z.string().url().optional(),
  alertDuration: z.number().min(1000).max(60000).default(5000),

  // 圖片設定
  imageWidth: z.number().min(0).default(0),
  imageHeight: z.number().min(0).default(0),

  // 文字設定
  textTemplate: z.string().default("感謝 {name} 贊助的 {amount} 元"),
  textEffect: z.string().default("無"),
  fixedFontSize: z.number().min(1).max(200).default(72),
  variableFontSize: z.number().min(1).max(200).default(72),

  // 音效設定
  soundVolume: z.number().min(0).max(100).default(20),
  ttsVolume: z.number().min(0).max(100).default(20),
  messagesFontSize: z.number().min(1).max(200).default(30),
});

export type UpdateOpaySettingsType = z.infer<typeof UpdateOpaySettingsSchema>;
