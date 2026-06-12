# 圖奇喵直播助理 — Vite + React 重寫規劃說明書

> 版本：2026-06-12  
> 狀態：規劃中（Next.js 14 先於 Vercel 上線，穩定後再執行）  
> 目標：將現有 Next.js Pages Router 專案重寫為 **Vite + React SPA**，API 獨立為 **Cloudflare Worker**

---

## 1. 為什麼要重寫

### 現況

| 項目 | 現狀 |
|------|------|
| 框架 | Next.js 14 Pages Router |
| 部署 | Vercel |
| 資料庫 | 無（Prisma 已移除） |
| 登入 | 無（NextAuth 已移除） |
| SSR | 無（所有頁面為靜態 + 客戶端渲染） |

### 問題

- Next.js 對本專案是「檔案路由 + API Routes 容器」，框架負擔大於收益
- 部署依賴 Next 版本與平台適配（Vercel / OpenNext）
- tRPC、Prisma、NextAuth 殘留依賴增加維護成本
- `package.json` 有未使用的重型依賴（`@google-cloud/translate`、`microsoft-cognitiveservices-speech-sdk`）

### 重寫後目標

```
瀏覽器 ──► Vite SPA（Cloudflare Pages 靜態託管）
              │
              └── fetch ──► Cloudflare Worker（/api/*）
                                │
                                ├── Twitch Helix API
                                └── Google Apps Script（翻譯）
```

**好處**：部署簡單、bundle 更小、職責清晰、無 Next 版本包袱。

---

## 2. 功能清單與遷移對照

### 2.1 頁面路由對照

| 現有 Next.js 路由 | 新 React Router 路徑 | 遷移難度 | 備註 |
|------------------|---------------------|---------|------|
| `/` | `/` | 低 | 首頁 Hero + 功能卡片 |
| `/board` | `/board` | 低 | 頻道設定 Dashboard |
| `/board/chat` | `/board/chat` | 低 | tmi.js 聊天朗讀 |
| `/song-request` | `/song-request` | 低 | 點歌入口 |
| `/song-request/[channel]` | `/song-request/:channel` | 低 | 點歌房間 |
| `/clips-manager` | `/clips-manager` | 低 | 剪輯 Widget 設定 |
| `/translator-manager` | `/translator-manager` | 低 | 翻譯機設定 |
| `/speech-to-text` | `/speech-to-text` | 中 | 語音辨識 + 翻譯 |
| `/widgets/clipsplayer` | `/widgets/clipsplayer` | 低 | OBS 剪輯播放（query params） |
| `/widgets/clips` | `/widgets/clips` | 低 | 剪輯 Widget |
| `/widgets/random-clips` | `/widgets/random-clips` | 低 | 隨機剪輯 |
| `/widgets/translatorplayer` | `/widgets/translatorplayer` | 中 | OBS 翻譯字幕 |
| `404` | `*` catch-all | 低 | 404 頁 |

### 2.2 API 對照（Next API Routes → Cloudflare Worker）

| 現有 API | Worker 路由 | 實作方式 | 備註 |
|---------|------------|---------|------|
| `GET /api/twitch/app-token` | `GET /api/twitch/app-token` | `fetch` Twitch OAuth | 需 `TWITCH_CLIENT_SECRET` |
| `GET /api/twitch/clips` | `GET /api/twitch/clips` | 呼叫 `lib/twitchApi` 邏輯 | query: channel, range 等 |
| `GET /api/twitch/stream-status` | `GET /api/twitch/stream-status` | `isChannelLive()` | query: login |
| `POST /api/translate` | `POST /api/translate` | proxy 到 Google Apps Script | 無 secret |
| `POST /api/speech-token` | `POST /api/speech-token` | 回傳 Azure key（需 Bearer token） | 可選保留 |
| `/api/trpc/[trpc]` | **刪除** | 無頁面使用 | 連 tRPC client 一併移除 |

### 2.3 可直接複製的模組（幾乎不改）

```
hooks/
  useChannelSettings.tsx    ✅ localStorage 頻道設定
  useChatLinkCollector.ts   ✅ tmi.js 連結收集
  useClipsForm.ts           ✅ 剪輯表單狀態
  useSpeechSynthesis.tsx    ✅ 瀏覽器 TTS
  useTwitchPlayer.ts        ✅ 剪輯預覽播放

lib/
  linkClassifier.ts         ✅ URL 分類
  constants.ts              ✅ 功能列表
  menu-list.ts              ✅ 側邊欄選單
  twitchApi.ts              ⚠️  移至 worker/，token cache 改 KV（可選）
  utils.ts                  ✅

components/                 ✅ shadcn/ui 全套可直接搬
styles/globals.css          ✅ Tailwind 沿用
```

### 2.4 需要改寫的部分

| 項目 | 改動 |
|------|------|
| `next/link` | → `react-router-dom` 的 `<Link>` |
| `next/router` | → `useNavigate` / `useParams` / `useSearchParams` |
| `next/head` | → `react-helmet-async` 或各頁 `<title>` |
| `next/image` | → 普通 `<img>`（已 unoptimized） |
| `pages/_app.tsx` layout | → `App.tsx` + `<Outlet />` + layout route |
| `trpc.withTRPC(App)` | → 刪除 |
| `utils/trpc.ts` | → 刪除 |
| `server/` 目錄 | → 邏輯併入 `worker/` |

---

## 3. 目標專案結構

```
allyoucaneat-vite/
├── src/
│   ├── main.tsx                 # Vite 入口
│   ├── App.tsx                  # Router + 全域 Provider
│   ├── routes/
│   │   ├── index.tsx            # 路由表
│   │   └── layouts/
│   │       ├── MainLayout.tsx   # Navbar + Footer（一般頁）
│   │       ├── BoardLayout.tsx  # 側邊欄 Dashboard
│   │       └── CleanLayout.tsx  # OBS / 點歌房（無 Navbar）
│   ├── pages/                   # 從現有 pages/ 搬入並改 import
│   ├── components/              # 原封不動
│   ├── hooks/                   # 原封不動
│   └── lib/                     # 前端用工具（不含 twitchApi）
├── worker/
│   ├── src/
│   │   ├── index.ts             # Hono app，掛載所有 /api/*
│   │   └── twitch.ts            # 從 lib/twitchApi.ts 搬入
│   └── wrangler.toml
├── public/
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 4. 技術選型

| 層級 | 選型 | 理由 |
|------|------|------|
| 建置 | Vite 6 | 快、簡單、靜態輸出 |
| 路由 | React Router 7 | 動態路由 `:channel`、nested layout |
| UI | 沿用 shadcn/ui + Tailwind | 零設計成本 |
| 狀態 | zustand（沿用）+ React Context | 頻道設定已有 Provider |
| API | Hono on Cloudflare Workers | 輕量、型別好、fetch 原生 |
| 部署 | Cloudflare Pages + Workers | 靜態 + API 一條龍 |
| Head | react-helmet-async | 取代 next/head |

---

## 5. 執行階段（建議 4 週、可壓縮為 3～5 天集中開發）

### Phase 0：準備（0.5 天）

- [ ] Next.js 版於 Vercel 穩定上線
- [ ] 確認所有功能手動測試通過
- [ ] 建立新 repo 或 `vite` 分支

### Phase 1：腳手架（0.5 天）

- [ ] `npm create vite@latest` + React + TypeScript
- [ ] 搬入 Tailwind、shadcn、`components/`、`hooks/`、`lib/`（前端部分）
- [ ] 設定 path alias `@/` → `src/`
- [ ] 建立三種 Layout

### Phase 2：頁面遷移（1.5 天）

優先順序（依使用頻率）：

1. `/song-request/*` — 核心新功能
2. `/board/*` — 控制台
3. `/` — 首頁
4. `/clips-manager` + `/widgets/*`
5. `/translator-manager` + `/speech-to-text`

每頁檢查清單：
- [ ] `useRouter().query` → `useSearchParams()` / `useParams()`
- [ ] `next/link` → `Link`
- [ ] `next/head` → helmet
- [ ] `fetch('/api/...')` 路徑不變（Worker 同域或 proxy）

### Phase 3：Worker API（1 天）

- [ ] 建立 Hono Worker，掛載 5 條 route
- [ ] 搬入 `twitchApi.ts` 邏輯
- [ ] Vite dev proxy：`vite.config.ts` 中 `/api` → `wrangler dev`
- [ ] 環境變數：`wrangler secret put TWITCH_CLIENT_SECRET`

### Phase 4：測試與上線（1 天）

- [ ] 本地：`vite dev` + `wrangler dev` 聯調
- [ ] Twitch Dev Console 加 Cloudflare 網域（剪輯 embed parent）
- [ ] Cloudflare Pages 綁定 repo，build command：`npm run build`
- [ ] Worker route：`yourdomain.com/api/*`
- [ ] 逐功能驗收（見下方測試矩陣）
- [ ] DNS 切換或並行運行一段時間

### Phase 5：收尾（0.5 天）

- [ ] 刪除 Next.js repo 或歸檔
- [ ] 更新 README
- [ ] 移除死依賴清單（見第 7 節）

---

## 6. 測試矩陣

| 功能 | 測試步驟 | 預期結果 |
|------|---------|---------|
| 首頁 Live 狀態 | 開啟 `/`，看 Footer | 顯示 Live / Offline |
| 頻道設定 | `/board` 輸入頻道名稱 | localStorage 保存，刷新仍在 |
| 觀眾點歌 | 開 `/song-request/你的頻道`，聊天室貼 YouTube 連結 | 自動收集並可播放 |
| 聊天朗讀 | `/board/chat` 連線 | tmi 連上，TTS 朗讀留言 |
| 剪輯管理 | `/clips-manager` 預覽 | 載入剪輯列表 |
| OBS 剪輯 Widget | `/widgets/clipsplayer?channel=...` | iframe 播放剪輯 |
| 翻譯機 | `/speech-to-text` 說話 | 顯示辨識 + 翻譯文字 |
| 404 | 訪問不存在路徑 | 顯示 404 頁 |

---

## 7. 刪除清單（重寫時一併清理）

### npm 依賴

```
@trpc/client @trpc/next @trpc/react-query @trpc/server
@google-cloud/translate
microsoft-cognitiveservices-speech-sdk
next next-auth @next-auth/prisma-adapter @prisma/client prisma
eslint-config-next
```

### 目錄 / 檔案

```
pages/           → 改為 src/pages/
server/          → 併入 worker/
utils/trpc.ts
prisma/          （已刪）
types/next-auth.d.ts （已刪）
```

---

## 8. 風險與對策

| 風險 | 影響 | 對策 |
|------|------|------|
| tmi.js WebSocket 被瀏覽器擋 | 點歌 / 聊天失效 | 本來就在瀏覽器跑，與框架無關；確認無 CSP 限制 |
| Twitch 剪輯 embed parent | 剪輯無法顯示 | 新網域加入 Twitch Dev Console |
| Worker token 無共享快取 | 多打 Twitch token API | 可接受；進階用 KV cache |
| 翻譯 Google Apps Script 限流 | 翻譯失敗 | 與現況相同，可之後換 Workers AI |
| 重寫期間功能回歸 | 用戶體驗 | Next 版保持上線，Vite 版並行測試後再切換 |

---

## 9. Vercel → Cloudflare 環境變數對照

| 變數 | Vercel | Cloudflare Worker |
|------|--------|-------------------|
| `NEXT_PUBLIC_CLIENT_ID` | ✅ | ✅（Pages 環境變數，build 時注入） |
| `TWITCH_CLIENT_SECRET` | ✅ | ✅ `wrangler secret` |
| `AZURE_SPEECH_KEY` | ✅ | ✅ secret |
| `AZURE_SPEECH_REGION` | ✅ | ✅ secret |
| `API_AUTH_TOKEN` | ✅ | ✅ secret |
| `NEXT_PUBLIC_API_AUTH_TOKEN` | ⚠️ 建議刪除 | 不需要 |

---

## 10. 不建議重寫的觸發條件

以下情況**先不要重寫**，繼續用 Next.js：

- 短期內要加 **SSR / SEO 著陸頁**
- 要恢復 **Twitch OAuth 登入 + 使用者資料庫**
- 團隊只有 1 人且要趕新功能上線

---

## 11. 參考指令（Phase 1 快速開始）

```bash
# 建立 Vite 專案
npm create vite@latest allyoucaneat-vite -- --template react-ts
cd allyoucaneat-vite
npm install react-router-dom react-helmet-async zustand tmi.js sonner
npm install -D tailwindcss postcss autoprefixer

# Worker
npm install hono
npm install -D wrangler

# 從舊專案複製
cp -r ../allyoucaneat-app/components src/
cp -r ../allyoucaneat-app/hooks src/
cp -r ../allyoucaneat-app/lib src/
cp -r ../allyoucaneat-app/styles src/
```

---

## 12. 決策紀錄

| 日期 | 決策 | 原因 |
|------|------|------|
| 2026-06-12 | 先 Vercel 部署 Next.js，再規劃 Vite 重寫 | 避免邊重寫邊上線的風險 |
| 2026-06-12 | API 目標平台選 Cloudflare Worker | 與 Vite 靜態託管搭配最簡單 |
| 2026-06-12 | 刪除 tRPC | 無客戶端呼叫，純粹累贅 |

---

*本文件隨重寫進度更新。完成 Phase 後在對應 checkbox 打勾。*
