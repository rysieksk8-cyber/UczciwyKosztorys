import { useCallback, useState } from 'react';

export function useVoicePanel() {
  const [mode, setMode] = useState<'voice' | 'manual'>('voice');
  const chooseVoice = useCallback(() => setMode('voice'), []);
  const chooseManual = useCallback(() => setMode('manual'), []);
  return { mode, chooseVoice, chooseManual };
}
