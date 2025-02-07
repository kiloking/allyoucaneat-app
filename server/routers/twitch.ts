import { TRPCError } from "@trpc/server";
import { procedure, router } from "../trpc";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import db from "@/lib/server/db";
const TWITCH_URL_API = "https://api.twitch.tv/helix";
const Client_ID = process.env.NEXT_PUBLIC_CLIENT_ID!;
const prisma = new PrismaClient();
const TWITCH_TOKEN_URL = "https://id.twitch.tv/oauth2/token";

export const twitchRouter = router({
  check: procedure.query(() => "yay!"),

  //Channels
  //GET 'https://api.twitch.tv/helix/channels/followers?broadcaster_id=123456'
  getChannelFollowers: procedure.query(async ({ ctx }) => {
    console.log("ctx", ctx.session?.user);
    // 確保使用者已登入
    if (!ctx.session?.user?.email) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    // 從資料庫獲取 token
    const user = await db.user.findFirst({
      where: {
        email: ctx.session.user.email,
      },
    });
    const account = await db.account.findFirst({
      where: {
        userId: user?.id,
        provider: "twitch",
      },
    });

    if (!account?.access_token) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    // 檢查 token 是否過期
    const isTokenExpired =
      account.expires_at && account.expires_at < Math.floor(Date.now() / 1000);

    let accessToken = account.access_token;
    if (isTokenExpired && account.refresh_token) {
      // 更新 token
      accessToken = await refreshAccessToken(
        account.refresh_token,
        account.providerAccountId
      );
    }

    // 使用新的或現有的 token
    const followersResponse = await fetch(
      `${TWITCH_URL_API}/channels/followers?broadcaster_id=${account.providerAccountId}`,
      {
        headers: {
          "Client-ID": Client_ID,
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    const channelResponse = await fetch(
      `${TWITCH_URL_API}/channels?broadcaster_id=${account.providerAccountId}`,
      {
        headers: {
          "Client-ID": Client_ID,
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    if (!followersResponse.ok || !channelResponse.ok) {
      throw new Error("Failed to fetch Twitch data");
    }

    const followersData = await followersResponse.json();
    const channelData = await channelResponse.json();
    return { total_followers: followersData.total, ...channelData.data[0] };
  }),
});

async function refreshAccessToken(
  refreshToken: string,
  providerAccountId: string
) {
  try {
    const response = await fetch(TWITCH_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.NEXT_PUBLIC_CLIENT_ID!,
        client_secret: process.env.NEXT_PUBLIC_CLIENT_SECRET!,
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error("Failed to refresh token");
    }

    // 更新資料庫中的 token
    await prisma.account.update({
      where: {
        provider_providerAccountId: {
          provider: "twitch",
          providerAccountId: providerAccountId,
        },
      },
      data: {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: Math.floor(Date.now() / 1000 + data.expires_in),
      },
    });

    return data.access_token;
  } catch (error) {
    console.error("Error refreshing token:", error);
    throw error;
  }
}
