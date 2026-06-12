const TWITCH_BASE_URL = "https://api.twitch.tv/helix";
const TOKEN_URL = "https://id.twitch.tv/oauth2/token";

interface AppTokenCache {
  accessToken: string;
  expiresAt: number;
}

let cachedToken: AppTokenCache | null = null;

function assertEnv() {
  if (!process.env.NEXT_PUBLIC_CLIENT_ID || !process.env.TWITCH_CLIENT_SECRET) {
    throw new Error("缺少 Twitch API 所需的環境變數");
  }
}

export async function getAppAccessToken() {
  assertEnv();
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.expiresAt > now + 60) {
    return cachedToken.accessToken;
  }

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: process.env.NEXT_PUBLIC_CLIENT_ID!,
      client_secret: process.env.TWITCH_CLIENT_SECRET!,
      grant_type: "client_credentials",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Twitch Token 取得失敗: ${error}`);
  }

  const data = await response.json();
  cachedToken = {
    accessToken: data.access_token,
    expiresAt: now + data.expires_in,
  };

  return cachedToken.accessToken;
}

export async function fetchTwitch<T>(
  endpoint: string,
  token?: string
): Promise<T> {
  const accessToken = token ?? (await getAppAccessToken());
  const response = await fetch(
    endpoint.startsWith("http") ? endpoint : `${TWITCH_BASE_URL}${endpoint}`,
    {
      headers: {
        "Client-ID": process.env.NEXT_PUBLIC_CLIENT_ID!,
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Twitch API 呼叫失敗 (${response.status}): ${errorBody || response.statusText}`
    );
  }

  return response.json() as Promise<T>;
}

interface TwitchUser {
  id: string;
  login: string;
  display_name: string;
  description?: string;
}

interface TwitchUsersResponse {
  data: TwitchUser[];
}

export async function getTwitchUserByLogin(login: string) {
  const data = await fetchTwitch<TwitchUsersResponse>(`/users?login=${login}`);
  return data.data?.[0] ?? null;
}

interface TwitchStream {
  id: string;
  user_login: string;
  type: string;
}

interface TwitchStreamsResponse {
  data: TwitchStream[];
}

/** 查詢指定頻道是否正在直播(app token 即可) */
export async function isChannelLive(login: string) {
  const data = await fetchTwitch<TwitchStreamsResponse>(
    `/streams?user_login=${encodeURIComponent(login)}`
  );
  return data.data.length > 0;
}

