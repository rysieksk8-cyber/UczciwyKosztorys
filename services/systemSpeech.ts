import { Platform } from 'react-native';
import type { SystemSpeechCallbacks, SystemSpeechSession } from './systemSpeechTypes';

// Load only when requested: older preview clients may not contain this native module.
function getSpeechModule() {
  try {
    const library = require('expo-speech-recognition') as typeof import('expo-speech-recognition');
    return library.ExpoSpeechRecognitionModule;
  } catch {
    throw new Error('Ten podgląd nie zawiera modułu systemowej mowy. Pobierz nową kompilację APK przyciskiem „Download” i zainstaluj ją na telefonie. Na iOS potrzebna jest nowa kompilacja aplikacji. Samo odświeżenie podglądu nie dodaje modułu. Opis nadal możesz wpisać ręcznie.');
  }
}

export function createSystemSpeechSession(callbacks: SystemSpeechCallbacks): SystemSpeechSession {
  const speech = getSpeechModule();
  if (!speech.isRecognitionAvailable()) {
    throw new Error('Telefon nie udostępnia usługi rozpoznawania mowy. Na Androidzie włącz lub zaktualizuj aplikację Google i usługę rozpoznawania mowy. Na iOS sprawdź dostępność dyktowania.');
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
