import { router } from "../trpc";
// import { storyRouter } from "./story";
// import { userRouter } from "./user";
import { twitchRouter } from "./twitch";
export const appRouter = router({
  twitch: twitchRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
