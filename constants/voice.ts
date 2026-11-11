import appConfig from '../app.json';

// One shared switch for native build exclusion and the visible input workflow.
export const keyboardDictationEnabled = appConfig.expo.extra.voiceInputMode === 'keyboard';

export const voiceLimits = {
  maxSeconds: 120,
  maxAudioBytes: 6 * 1024 * 1024,
  maxBase64Length: 8 * 1024 * 1024,
  sampleRate: 16000,
};
