import { useEffect } from "react";
import { useRouter } from "next/router";

export default function Custom404() {
  const router = useRouter();

  useEffect(() => {
    // 自動重定向到首頁
    router.replace("/");
  }, [router]);

  return null; // 或者你也可以顯示一個簡單的載入畫面
}
