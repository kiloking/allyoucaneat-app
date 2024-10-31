import { ThemeProvider } from "@/components/theme-provider";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { SessionProvider } from "next-auth/react";
import { trpc } from "@/utils/trpc"; // trpc client
function App({ Component, pageProps }: AppProps) {
  return (
    <SessionProvider session={pageProps.session}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <Component {...pageProps} />{" "}
      </ThemeProvider>
    </SessionProvider>
  );
}

export default trpc.withTRPC(App);
