import { useState } from 'react';

export interface ClipsConfig {
  channelName: string;
  mode: 'random' | 'top';
  timeRange: 'all' | '7d' | '30d' | '6m' | '1y';
  maxLength: number;
  volume: number;
  showOverlay: boolean;
  showTimer: boolean;
  preferCurrentCategory: boolean;
}

const initialConfig: ClipsConfig = {
  channelName: '',
  mode: 'random',
  timeRange: '7d',
  maxLength: 60,
  volume: 60,
  showOverlay: true,
  showTimer: false,
  preferCurrentCategory: false,
};

export function useClipsForm() {
  const [config, setConfig] = useState<ClipsConfig>(initialConfig);

  const handleConfigChange = <K extends keyof ClipsConfig>(
    key: K,
    value: ClipsConfig[K]
  ) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  return { config, handleConfigChange, setConfig };
}
