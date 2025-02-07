import React, { useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/router";

const Login = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/board");
    }
  }, [status, router]);

  const handleTwitchLogin = async () => {
    try {
      await signIn("twitch", { callbackUrl: "/board" });
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <button
        onClick={handleTwitchLogin}
        className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700"
      >
        使用 Twitch 登入
      </button>
    </div>
  );
};

export default Login;
