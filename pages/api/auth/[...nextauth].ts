// pages/api/auth/[...nextauth].ts

import NextAuth, { AuthOptions } from "next-auth";
import TwitchProvider from "next-auth/providers/twitch";

// 自定義 Twitch 的 profile 規則
export const authOptions: AuthOptions = {
  secret: process.env.NEXTAUTH_SECRET, // 請確保在 .env.local 文件中設置了 NEXTAUTH_SECRET
  providers: [
    TwitchProvider({
      clientId: process.env.NEXT_PUBLIC_CLIENT_ID as string,
      clientSecret: process.env.NEXT_PUBLIC_CLIENT_SECRET as string,
      authorization: {
        params: {
          scope:
            "openid user:read:email user:read:follows channel:read:subscriptions channel:read:vips",
          claims: {
            id_token: {
              email: null,
              picture: null,
              preferred_username: null,
            },
          },
        },
      },
      profile(profile: any) {
        return {
          id: profile.sub,
          name: profile.preferred_username,
          email: profile.email,
          image: profile.picture,
        };
      },
    }),
  ],
  callbacks: {
    async session({ session, token, user }) {
      return { ...session, token };
    },
    async jwt({ token, user, account, profile }) {
      return { ...token, ...account };
    },
  },
};

export default NextAuth(authOptions);
