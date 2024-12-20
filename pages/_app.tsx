import { ThemeProvider } from "@/components/theme-provider";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { SessionProvider, useSession } from "next-auth/react";
import { trpc } from "@/utils/trpc";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { Navbar } from "@/components/layouts/Navbar";
import Head from "next/head";
import { Toaster } from "sonner";
import Footer from "@/components/layouts/Footer";

// 需要登入才能訪問的頁面路徑
const protectedRoutes = ["/board", "/settings", "/analytics"];

// 身份驗證包裝器組件
function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isLoading = status === "loading";
  const isProtectedRoute = protectedRoutes.some((route) =>
    router.pathname.startsWith(route)
  );

  // 檢查是否為後台頁面

  useEffect(() => {
    if (!isLoading && !session && isProtectedRoute) {
      router.push({
        pathname: "/",
        query: { returnUrl: router.asPath },
      });
    }
  }, [session, isLoading, router, isProtectedRoute]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!session && isProtectedRoute) {
    return null;
  }

  return <>{children}</>;
}

function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  // /board /widgets/clipsplayer 頁面不顯示 Navbar
  const isDashboardPage = router.pathname?.startsWith("/board");
  const isClipsPlayerPage = router.pathname?.startsWith("/widgets/clipsplayer");
  return (
    <>
      <Head>
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/earlyaccess/cwtexyen.css"
        />
        <title>圖奇喵直播助理</title>
        <meta
          name="description"
          content="Twitch 實況主的最佳助手，提供多樣化的 Widgets 可以幫助您提升觀眾互動體驗"
        />
      </Head>
      <SessionProvider session={pageProps.session}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthWrapper>
            {!isDashboardPage && !isClipsPlayerPage ? <Navbar /> : null}
            <Component {...pageProps} />
            {!isDashboardPage && !isClipsPlayerPage ? <Footer /> : null}
          </AuthWrapper>
        </ThemeProvider>
      </SessionProvider>
      <Toaster position="top-center" />
    </>
  );
}

export default trpc.withTRPC(App);
