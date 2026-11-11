export interface SystemSpeechAvailability {
  available: boolean;
  reason: string;
}

export const systemSpeechMessages = {
  keyboardOnly: 'W tej wersji użyj mikrofonu klawiatury telefonu. Dotknij pola opisu, potem mikrofonu na klawiaturze i mów po polsku. Przycisk nagrywania w aplikacji jest tymczasowo wyłączony. Jeśli klawiatura nie udostępnia dyktowania, wpisz tekst ręcznie.',
  missingModule: 'Ta zainstalowana wersja aplikacji nie zawiera modułu mowy. W OnSpace wybierz Download → Android APK, wygeneruj nowy plik i zainstaluj go na telefonie jako aktualizację. Na iOS wymagana jest nowa kompilacja. Expo Go i starszy klient podglądu nie dodadzą modułu po odświeżeniu. Nie usuwaj danych aplikacji — zawierają lokalną historię. Do czasu aktualizacji możesz wpisać opis ręcznie.',
  unsupportedBrowser: 'Ta przeglądarka nie udostępnia systemowego rozpoznawania mowy. Spróbuj w Chrome lub użyj nowej kompilacji aplikacji na telefon. Opis możesz nadal wpisać ręcznie.',
  unavailableService: 'Telefon nie udostępnia usługi rozpoznawania mowy. Na Androidzie włącz lub zaktualizuj aplikację Google i usługę rozpoznawania mowy. Na iOS sprawdź dostępność dyktowania. Po zmianie ustawień wróć do aplikacji.',
};

export interface SystemSpeechCallbacks {
  onStart: () => void;
  onResult: (text: string, isFinal: boolean) => void;
  onError: (code: string) => void;
  onEnd: () => void;
}

export interface SystemSpeechSession {
  start: () => Promise<void>;
  stop: () => void;
  dispose: () => void;
}

export function systemSpeechError(code: string): string {
  switch (code) {
    case 'not-allowed':
      return 'Zezwól na mikrofon i rozpoznawanie mowy w ustawieniach urządzenia lub przeglądarki. Podgląd może blokować dostęp do mikrofonu; wtedy użyj zainstalowanej aplikacji.';
    case 'language-not-supported':
      return 'Usługa systemowa nie obsługuje teraz języka polskiego. Włącz lub pobierz język polski w ustawieniach rozpoznawania mowy telefonu.';
    case 'network':
      return 'Systemowe rozpoznawanie wymaga teraz internetu. Sprawdź połączenie i spróbuj ponownie. Nie jest to blokada OnSpace AI.';
    case 'audio-capture':
      return 'Mikrofon jest niedostępny. Zamknij inne nagrywanie i sprawdź uprawnienia.';
    case 'service-not-allowed':
      return 'Usługa rozpoznawania mowy jest niedostępna. Na Androidzie włącz lub zaktualizuj aplikację Google oraz usługę rozpoznawania mowy.';
    case 'no-speech':
    case 'speech-timeout':
      return 'Nie wykryto mowy. Dotknij mikrofonu i zacznij mówić po pojawieniu się licznika.';
    case 'busy':
    case 'too-many-requests':
      return 'Systemowa usługa mowy jest zajęta. Poczekaj chwilę i spróbuj ponownie.';
    case 'interrupted':
      return 'Rozpoznawanie przerwała inna funkcja telefonu. Sprawdź zachowany tekst i nagraj dalszą część.';
    default:
      return 'System nie zakończył rozpoznawania. Sprawdź dostępny tekst i spróbuj ponownie lub wpisz opis ręcznie.';
  }
}
