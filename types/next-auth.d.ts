import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: User;
    expires: string;
    token: Token;
  }

  interface User {
    id: string;
    name: string;
    email: string;
    image: string;
  }

  interface Token {
    access_token: string;
    refresh_token: string;
    expires_at: number;
    id_token: string;
    scope: string;
    token_type: string;
    iat: number;
    exp: number;
    jti: string;
    sub: string;
    provider: string;
    type: string;
    providerAccountId: string;
    picture: string;
    name: string;
    email: string;
  }

  interface JWT {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  }
}
