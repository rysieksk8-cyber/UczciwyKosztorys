import { keyboardDictationEnabled } from '@/constants/voice';
import { systemSpeechMessages } from './systemSpeechTypes';
import type { SystemSpeechAvailability, SystemSpeechCallbacks, SystemSpeechSession } from './systemSpeechTypes';

// Temporary native fallback: no import or access to the incompatible module.
// Keyboard dictation supplies text through the ordinary editable TextInput.
export function getSystemSpeechAvailability(): SystemSpeechAvailability {
  return {
    available: false,
    reason: keyboardDictationEnabled ? systemSpeechMessages.keyboardOnly : systemSpeechMessages.missingModule,
  };
}

export function createSystemSpeechSession(_callbacks: SystemSpeechCallbacks): SystemSpeechSession {
  throw new Error(getSystemSpeechAvailability().reason);
}
