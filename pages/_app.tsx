import { ThemeProvider } from "@/components/theme-provider";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { trpc } from "@/utils/trpc";
import { useRouter } from "next/router";
import { Navbar } from "@/components/layouts/Navbar";
import Head from "next/head";
import { Toaster } from "sonner";
import Footer from "@/components/layouts/Footer";
import { ChannelSettingsProvider } from "@/hooks/useChannelSettings";

function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  const isDashboardPage = router.pathname?.startsWith("/board");
  const isClipsPlayerPage = router.pathname?.startsWith("/widgets/clipsplayer");
  // 點歌房間頁要乾淨畫面方便 OBS 擷取(入口頁 /song-request 仍顯示 Navbar)
  const isSongRequestRoom = router.pathname?.startsWith("/song-request/");

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
      <ChannelSettingsProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {!isDashboardPage && !isClipsPlayerPage && !isSongRequestRoom ? (
            <Navbar />
          ) : null}
          <Component {...pageProps} />
          {!isDashboardPage && !isClipsPlayerPage && !isSongRequestRoom ? (
            <Footer />
          ) : null}
        </ThemeProvider>
      </ChannelSettingsProvider>
      <Toaster position="top-center" />
    </>
  );
}

export default trpc.withTRPC(App);
