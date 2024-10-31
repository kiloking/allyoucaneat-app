import { TRPCError } from "@trpc/server";
import { procedure, router } from "../trpc";
import { z } from "zod";
const TWITCH_URL_API = "https://api.twitch.tv/helix";
const Client_ID = process.env.NEXT_PUBLIC_CLIENT_ID!;
export const twitchRouter = router({
  check: procedure.query(() => "yay!"),

  //Channels
  //GET 'https://api.twitch.tv/helix/channels/followers?broadcaster_id=123456'
  getChannelFollowers: procedure.query(async ({ input, ctx }) => {
    const accessToken = ctx.session?.token.access_token;
    const providerAccountId = ctx.session?.token.providerAccountId;
    const response = await fetch(
      `${TWITCH_URL_API}/channels/followers?broadcaster_id=${providerAccountId}`,
      {
        headers: {
          "Client-ID": Client_ID,
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    if (!response.ok) {
      throw new Error("Failed to fetch Twitch channel data");
    }
    const data = await response.json();
    return data;
  }),
});
