import { systemSpeechMessages } from './systemSpeechTypes';
import type { SystemSpeechAvailability, SystemSpeechCallbacks, SystemSpeechSession } from './systemSpeechTypes';

interface BrowserSpeechResult {
  isFinal: boolean;
  0?: { transcript: string };
}
interface BrowserSpeechEvent {
  resultIndex: number;
  results: { length: number; [index: number]: BrowserSpeechResult };
}
interface BrowserSpeechRecognizer {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onresult: ((event: BrowserSpeechEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

function getBrowserRecognition() {
  // Called from a mounted hook or a user action, never during server rendering.
  const browser = globalThis as typeof globalThis & {
    SpeechRecognition?: new () => BrowserSpeechRecognizer;
    webkitSpeechRecognition?: new () => BrowserSpeechRecognizer;
  };
  return browser.SpeechRecognition ?? browser.webkitSpeechRecognition;
}

export function getSystemSpeechAvailability(): SystemSpeechAvailability {
  return getBrowserRecognition()
    ? { available: true, reason: '' }
    : { available: false, reason: systemSpeechMessages.unsupportedBrowser };
}

export function createSystemSpeechSession(callbacks: SystemSpeechCallbacks): SystemSpeechSession {
  const Recognition = getBrowserRecognition();
  if (!Recognition) {
    throw new Error(systemSpeechMessages.unsupportedBrowser);
  }
  const speech = new Recognition();
  const delivered = new Set<number>();
  let disposed = false;
  speech.lang = 'pl-PL';
  speech.continuous = true;
  speech.interimResults = true;
  speech.maxAlternatives = 1;
  speech.onstart = () => { if (!disposed) callbacks.onStart(); };
  speech.onresult = event => {
    if (disposed) return;
    for (let index = event.resultIndex; index < event.results.length; index += 1) {
      const result = event.results[index];
      if (result.isFinal && !delivered.has(index)) {
        delivered.add(index);
        callbacks.onResult(result[0]?.transcript ?? '', true);
      }
    }
    const interim: string[] = [];
    for (let index = 0; index < event.results.length; index += 1) {
      const result = event.results[index];
      if (!result.isFinal) interim.push(result[0]?.transcript ?? '');
    }
    callbacks.onResult(interim.join(' ').trim(), false);
  };
  speech.onerror = event => {
    if (!disposed && event.error !== 'aborted') callbacks.onError(event.error);
  };
  speech.onend = () => { if (!disposed) callbacks.onEnd(); };
  return {
    start: async () => {
      if (disposed) return;
      try { speech.start(); }
      catch {
        throw new Error('Przeglądarka nie uruchomiła rozpoznawania. Sprawdź uprawnienia mikrofonu. Podgląd w ramce może blokować tę funkcję; wtedy użyj nowej kompilacji aplikacji na telefonie.');
      }
    },
    stop: () => { if (!disposed) speech.stop(); },
    dispose: () => {
      if (disposed) return;
      disposed = true;
      speech.onstart = null;
      speech.onresult = null;
      speech.onerror = null;
      speech.onend = null;
      try { speech.abort(); } catch { /* The session may already have ended. */ }
    },
  };
}
