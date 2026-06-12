import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export interface ChannelSettings {
  channelName: string;
  setChannelName: (value: string) => void;
  clearChannelName: () => void;
}

const STORAGE_KEY = "twitchmeow_channel_name";

const ChannelSettingsContext = createContext<ChannelSettings | null>(null);

export function ChannelSettingsProvider({ children }: { children: ReactNode }) {
  const [channelName, setChannelNameState] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedValue = window.localStorage.getItem(STORAGE_KEY);
    if (storedValue) {
      setChannelNameState(storedValue);
    }
  }, []);

  const setChannelName = (value: string) => {
    const trimmed = value.trim();
    setChannelNameState(trimmed);
    if (typeof window !== "undefined") {
      if (trimmed) {
        window.localStorage.setItem(STORAGE_KEY, trimmed);
      } else {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }
  };

  const clearChannelName = () => {
    setChannelName("");
  };

  const contextValue = useMemo<ChannelSettings>(
    () => ({
      channelName,
      setChannelName,
      clearChannelName,
    }),
    [channelName]
  );

  return (
    <ChannelSettingsContext.Provider value={contextValue}>
      {children}
    </ChannelSettingsContext.Provider>
  );
}

export function useChannelSettings() {
  const context = useContext(ChannelSettingsContext);
  if (!context) {
    throw new Error(
      "useChannelSettings must be used within a ChannelSettingsProvider"
    );
  }
  return context;
}
