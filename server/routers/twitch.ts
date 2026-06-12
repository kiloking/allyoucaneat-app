import { procedure, router } from "../trpc";

// 後台功能(頻道總覽等)已移除,詳見 docs/BACKEND_FEATURES_MEMO.md
export const twitchRouter = router({
  check: procedure.query(() => "yay!"),
});
