import { useCallback, useEffect, useRef, useState } from "react";
import tmi from "tmi.js";
import {
  ClassifiedLink,
  classifyUrl,
  extractUrls,
} from "@/lib/linkClassifier";

export interface CollectedLink extends ClassifiedLink {
  submittedBy: string;
  timestamp: number;
}

const storageKey = (channel: string) => `song-request:${channel}`;

/**
 * 匿名連上指定頻道的聊天室,自動收集觀眾貼的連結。
 * 收集結果以頻道為單位存在 localStorage,重新整理不會遺失。
 */
export function useChatLinkCollector(channel: string) {
  const [links, setLinks] = useState<CollectedLink[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const clientRef = useRef<tmi.Client | null>(null);
  // 用 ref 做同步去重,避免同一批訊息重複加入
  const seenIdsRef = useRef<Set<string>>(new Set());

  // 載入此頻道先前收集的連結
  useEffect(() => {
    if (!channel) return;
    try {
      const saved = localStorage.getItem(storageKey(channel));
      if (saved) {
        const parsed: CollectedLink[] = JSON.parse(saved);
        seenIdsRef.current = new Set(parsed.map((link) => link.id));
        setLinks(parsed);
      }
    } catch {
      // 壞掉的存檔直接忽略
    }
  }, [channel]);

  // 同步寫回 localStorage
  useEffect(() => {
    if (!channel) return;
    localStorage.setItem(storageKey(channel), JSON.stringify(links));
  }, [channel, links]);

  // 連線聊天室
  useEffect(() => {
    if (!channel) return;

    const client = new tmi.Client({ channels: [channel] });
    clientRef.current = client;

    client.on("message", (_ch, tags, message) => {
      const urls = extractUrls(message);
      if (urls.length === 0) return;

      const submittedBy = tags["display-name"] || tags.username || "未知用戶";
      const fresh: CollectedLink[] = [];

      for (const url of urls) {
        const classified = classifyUrl(url);
        if (!classified || seenIdsRef.current.has(classified.id)) continue;
        seenIdsRef.current.add(classified.id);
        fresh.push({ ...classified, submittedBy, timestamp: Date.now() });
      }

      if (fresh.length > 0) {
        setLinks((prev) => [...prev, ...fresh]);
      }
    });

    client
      .connect()
      .then(() => setIsConnected(true))
      .catch((err) => console.error("聊天室連線失敗:", err));

    return () => {
      client.disconnect().catch(() => undefined);
      clientRef.current = null;
      setIsConnected(false);
    };
  }, [channel]);

  const removeLink = useCallback((id: string) => {
    seenIdsRef.current.delete(id);
    setLinks((prev) => prev.filter((link) => link.id !== id));
  }, []);

  const clearLinks = useCallback(() => {
    seenIdsRef.current = new Set();
    setLinks([]);
  }, []);

  return { links, isConnected, removeLink, clearLinks };
}
