# 後台功能備忘(已移除,未來需要再重建)

> 移除日期:2026-06-12
> 原因:專案方向改為「免登入即可使用的實況主工具」,後台(登入 / 資料庫 / 斗內)整套先放掉。
> 完整程式碼都在 git 歷史中,最後保有這些功能的 commit 為 `31ceeaa`(及更早)。

---

## 1. 會員登入系統(NextAuth + Twitch OAuth)

**原本功能:** 使用 Twitch OAuth 登入,登入後才能進 `/board` 等受保護頁面,session 存在 PostgreSQL。

**當時的組成:**

- `pages/api/auth/[...nextauth].ts` — NextAuth 設定(TwitchProvider)
- `pages/auth/login.tsx` — 登入頁
- `types/next-auth.d.ts` — session 型別擴充
- `pages/_app.tsx` 內的 `AuthWrapper` — 保護 `/board`、`/settings`、`/analytics` 路由
- Prisma models:`User`、`Account`、`Session`
- 環境變數:`NEXTAUTH_URL`、`NEXTAUTH_SECRET`

**若要重建:** 屆時建議直接評估 Auth.js v5(NextAuth 改名後的新版)或 Clerk;
舊版寫法是 next-auth v4 + Pages Router,API 已有不少變動。

---

## 2. 歐付寶(OPay)斗內通知系統

**原本功能:** 實況主設定自己的歐付寶商店資訊,觀眾斗內後在 OBS widget 顯示通知(音效、圖片、TTS、自訂文字模板)。

**當時的組成:**

- Prisma models:`OpaySettings`(商店代號/HashKey/HashIV、通知音效圖片、文字模板、字體大小、音量等完整欄位)、`Donation`(斗內紀錄:金額、贊助者、留言、交易編號)
- `server/routers/type.ts` — `UpdateOpaySettingsSchema`(zod,完整欄位驗證)
- `server/database/opay.ts` — 資料存取層(移除前已被清空)
- migrations:`20241227091110_init_opay_settings`(建立)→ `20250206074747_remove_opay_settings`(移除)

**設定欄位備忘(重建時的規格參考):**
opayId、merchantId、hashKey、hashIV、enabled、minAmount(預設 10)、channelUrl、
alertSound、alertImage、alertDuration(預設 5000ms)、imageWidth/Height、
textTemplate(預設「感謝 {name} 贊助的 {amount} 元」)、textEffect、
fixedFontSize/variableFontSize(預設 72)、soundVolume/ttsVolume(預設 20)、messagesFontSize(預設 30)

**若要重建:** 此功能必然需要帳號系統(設定跟著使用者走),要先重建第 1 項。

---

## 3. 頻道總覽(tRPC `twitch.getChannelOverview`)

**原本功能:** 在 `/board` 顯示頻道追隨者數、是否開台、目前遊戲與標題。

**當時的組成:**

- `server/routers/twitch.ts` 的 `getChannelOverview` procedure
- `lib/twitchApi.ts` 的 `getFollowerTotal`、`getStreamInfo`

**重要陷阱(重建時必看):**

- 舊端點 `GET /helix/users/follows?to_id=` 已於 2023 年被 Twitch 下線。
- 新端點為 `GET /helix/channels/followers?broadcaster_id=<id>&first=1`,
  **App Access Token 可以拿到 `total`(總數)**,但追隨者「名單」需要 broadcaster 的 user token + `moderator:read:followers` scope。
- `/helix/streams?user_id=` 仍可用 app token 查開台狀態。

---

## 4. 資料庫(Prisma + PostgreSQL)

- 整個 Prisma 已移除(`prisma/` 目錄、`@prisma/client`、`db:*` scripts)。
- schema 最後版本見 git 歷史 `prisma/schema.prisma`(commit `31ceeaa`)。
- 環境變數 `DATABASE_URL` 目前已無程式使用。

---

## 環境變數現況

| 變數 | 狀態 |
|---|---|
| `NEXT_PUBLIC_CLIENT_ID` / `TWITCH_CLIENT_ID` | ✅ 使用中(clips API、widgets) |
| `TWITCH_CLIENT_SECRET` | ✅ 使用中(app token)— **2026-06 驗證為已失效,需到 Twitch Dev Console 重新產生** |
| `AZURE_SPEECH_KEY` / `AZURE_SPEECH_REGION` | ✅ 使用中(翻譯機語音辨識) |
| `API_AUTH_TOKEN` / `NEXT_PUBLIC_API_AUTH_TOKEN` | 視 api/translate、api/speech-token 使用情況 |
| `DATABASE_URL` | ❌ 已無程式使用,可移除 |
| `NEXTAUTH_URL` / `NEXTAUTH_SECRET` | ❌ 已無程式使用,可移除 |
| `NEXT_PUBLIC_CLIENT_SECRET` | ⚠️ 從未該存在 —`NEXT_PUBLIC_` 前綴會把 secret 打包進前端,請從 `.env.local` 刪除 |
