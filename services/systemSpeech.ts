import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';
import { systemSpeechMessages } from './systemSpeechTypes';
import type { SystemSpeechAvailability, SystemSpeechCallbacks, SystemSpeechSession } from './systemSpeechTypes';

// Type-only reference: importing the package at runtime eagerly calls requireNativeModule
// and can produce a Hermes fatal error in Expo Go or an older installed APK.
// The config plugin in app.json still includes this dependency in new native builds.
type SpeechModule = typeof import('expo-speech-recognition').ExpoSpeechRecognitionModule;

function getSpeechModule(): SpeechModule | null {
  try {
    return requireOptionalNativeModule<SpeechModule>('ExpoSpeechRecognition');
  } catch {
    // Unsupported preview clients may not expose Expo's module registry.
    return null;
  }
}

export function getSystemSpeechAvailability(): SystemSpeechAvailability {
  const speech = getSpeechModule();
  if (!speech) return { available: false, reason: systemSpeechMessages.missingModule };
  try {
    if (!speech.isRecognitionAvailable()) {
      return { available: false, reason: systemSpeechMessages.unavailableService };
    }
    return { available: true, reason: '' };
  } catch {
    return { available: false, reason: systemSpeechMessages.unavailableService };
  }
}

export function createSystemSpeechSession(callbacks: SystemSpeechCallbacks): SystemSpeechSession {
  const speech = getSpeechModule();
  if (!speech) throw new Error(systemSpeechMessages.missingModule);
  if (!speech.isRecognitionAvailable()) {
    throw new Error(systemSpeechMessages.unavailableService);
  }
  let disposed = false;
  let started = false;
  const subscriptions = [
    speech.addListener('start', () => { if (!disposed) callbacks.onStart(); }),
    speech.addListener('result', event => {
      if (!disposed) callbacks.onResult(event.results[0]?.transcript ?? '', event.isFinal);
    }),
    speech.addListener('error', event => {
      if (!disposed && event.error !== 'aborted') callbacks.onError(event.error);
    }),
    speech.addListener('end', () => { if (!disposed) callbacks.onEnd(); }),
  ];

  return {
    start: async () => {
      const permission = await speech.requestPermissionsAsync();
      if (disposed) return;
      if (!permission.granted) {
        throw new Error('Zezwól na mikrofon oraz rozpoznawanie mowy w ustawieniach aplikacji. Obie zgody są potrzebne do dyktowania po polsku.');
      }
      started = true;
      speech.start({
        lang: 'pl-PL',
        interimResults: true,
        maxAlternatives: 1,
        continuous: Platform.OS !== 'android' || Number(Platform.Version) >= 33,
        requiresOnDeviceRecognition: false,
        addsPunctuation: true,
        contextualStrings: ['robocizna', 'klocki hamulcowe', 'łożysko', 'rozrząd', 'olej silnikowy', 'cena zakupu', 'złotych', 'Octavia'],
        recordingOptions: { persist: false },
      });
    },
    stop: () => { if (!disposed && started) speech.stop(); },
    dispose: () => {
      if (disposed) return;
      disposed = true;
      subscriptions.forEach(subscription => subscription.remove());
      if (started) {
        try { speech.abort(); } catch { /* An ended system session needs no abort. */ }
      }
    },
  };
}
