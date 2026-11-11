import { useCallback, useRef, useState } from 'react';
import type { TextInput } from 'react-native';
import { keyboardDictationEnabled } from '@/constants/voice';

export function useVoicePanel() {
  const [mode, setMode] = useState<'voice' | 'manual'>(keyboardDictationEnabled ? 'manual' : 'voice');
  const descriptionRef = useRef<TextInput | null>(null);
  const focusDescription = useCallback(() => descriptionRef.current?.focus(), []);
  const chooseVoice = useCallback(() => setMode('voice'), []);
  const chooseManual = useCallback(() => setMode('manual'), []);
  return { mode, chooseVoice, chooseManual, keyboardOnly: keyboardDictationEnabled, descriptionRef, focusDescription };
}
