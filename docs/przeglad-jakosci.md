# Kosztorys Mechanika — przegląd jakości

## Aktualne obejście: dyktowanie klawiaturą zamiast modułu natywnego

Po uzyskaniu zgody użytkownika włączono tymczasowy tryb `expo.extra.voiceInputMode: "keyboard"`. Poniższe starsze sekcje opisują wcześniejsze etapy; aktualny przepływ dyktowania opisuje ta sekcja.

- Krok „Opis” otwiera zwykłe, edytowalne pole tekstowe. Przycisk „Otwórz klawiaturę” ustawia fokus w polu — nie uruchamia automatycznie mikrofonu. Użytkownik sam dotyka mikrofonu swojej klawiatury. Dostępność dyktowania, uprawnienia i język polski zależą od telefonu i klawiatury. Pisanie ręczne jest nadal dostępne.
- Aplikacja nie nagrywa głosu i nie wywołuje OnSpace AI. Otrzymuje tekst z klawiatury; dostawca klawiatury lub system może przetwarzać głos w swojej usłudze. Dodano widoczną instrukcję oraz pomoc dla Androida i iPhone'a.
- Zachowano plugin `withSpeechCompatibility`. W trybie klawiatury dopisuje wykluczenie `expo-speech-recognition` do wygenerowanego `android/settings.gradle` i `ios/Podfile`. Usunięto z app.json plugin samego pakietu mowy; samo usunięcie pluginu nie wystarczałoby do zatrzymania kompilacji biblioteki.
- Dodano `react-native.config.js` z wyłączeniem tego samego pakietu dla autolinkowania React Native, niezależnie od autolinkowania Expo. Serwis natywny nie importuje ani nie odwołuje się do modułu mowy. Ten sam przełącznik z app.json jest odczytywany przez interfejs i konfigurację natywną.
- Nie zmieniono package.json, plików blokady ani node_modules. Pakiet może nadal być instalowany, lecz konfiguracja ma wykluczyć go z natywnej kompilacji. Nie jest to naprawa jego wersji ani regeneracja pnpm-lock.yaml.
- Implementacja opiera się na API Expo SDK 53: `expoAutolinking.exclude` przed `expoAutolinking.useExpoModules()` oraz opcji `:exclude` w `use_expo_modules!`. SDK 53 ma błąd przekazywania wielu wykluczeń jako jednego argumentu; tutaj użyto jednego pakietu. Jeśli istnieją inne wykluczenia albo układ plików jest nieznany, plugin zatrzymuje operację zamiast nadpisywać pozostałą konfigurację lub dopuszczać wadliwy moduł.
- Nie zmieniono klucza pamięci, historii, cen, ustawień, PDF ani WhatsApp. Nie odinstalowuj aplikacji ani nie czyść jej danych przy aktualizacji.

### Stan weryfikacji

Przeanalizowano kod i szablony/API Expo SDK 53. Dodano `scripts/check-speech-bypass.cjs` z kontrolą konfiguracji, idempotencji transformacji, CRLF, zachowania innych wpisów i bezpiecznej odmowy dla nieznanych szablonów. **Nie uruchomiono testów, prebuild ani kompilacji APK** — edytor nie udostępnia terminala. Obejście nie gwarantuje, że nie wystąpi inny błąd budowy. Nie należy uznawać APK za naprawione bez wyniku kompilacji.

Lokalne kontrole po eksporcie, bez generowania APK:

```sh
node scripts/check-speech-bypass.cjs
node scripts/check-core.cjs
npx tsc --noEmit
```

Po wygenerowaniu projektu natywnego można sprawdzić zapisane wykluczenia przez `node scripts/check-speech-bypass.cjs --verify-native`. To nadal nie jest test kompilacji Kotlin ani działającego APK. W logu prawdziwej kompilacji `expo-speech-recognition` nie powinien występować na liście używanych modułów ani jako zadanie `:expo-speech-recognition:compileDebugKotlin`. Odświeżenie podglądu nie przebudowuje zainstalowanej aplikacji.

Test telefonu: otwórz nowy kosztorys → „Opis” → pole tekstowe → mikrofon klawiatury, podyktuj nazwę pracy i ceny, popraw liczby, przejdź do pozycji, zapisz i przygotuj PDF. Sprawdź też pisanie bez mikrofonu i brak utraty starej historii.

Przywrócenie przycisku mikrofonu w aplikacji wymaga ponownego dodania serwisu natywnego oraz pluginu pakietu, zgodnej z Expo zainstalowanej wersji i nowej kompilacji. Samo przełączenie `voiceInputMode` nie przywraca mowy. Oryginalna kontrola zgodności wersji pozostaje w `withSpeechCompatibility` dla trybu systemowego.

## Zakres i ograniczenia

Wykonano przegląd statyczny istniejących ekranów, nawigacji, zapisu, parsera, wyceny, PDF, WhatsApp i dyktowania. W narzędziach podglądu nie znaleziono zapisanych żądań sieciowych; nie stanowi to testu działania funkcji.

W tym edytorze nie ma narzędzia do uruchomienia TypeScript, testów ani kompilacji Android/iOS. Nie uruchomiono APK, nie przetestowano mikrofonu na urządzeniu ani wysyłki do WhatsApp. Testy regresji dodano jako kod, ale nie wykonano ich. Nie można uznać aplikacji za zweryfikowaną na telefonie.

## Błędy poprawione w kodzie

- Parser rozdzielał `1.5 godziny` na dwie pozycje. Zachowuje teraz liczby z kropką/przecinkiem i skróty `szt.`, `godz.`, `np.`.
- Opis `wymiana płynu` mógł trafić do materiałów zamiast robocizny. Czynności mają teraz pierwszeństwo kategorii.
- Powrót do zmienionego opisu mógł bez pytania nadpisać ręczne ceny. Przed ponowną analizą trzeba wybrać zachowanie albo zastąpienie pozycji.
- Pola z `defaultValue` mogły pokazywać nieaktualne ceny po zmianie kategorii. Pola liczbowe synchronizują wartości i zachowują przecinek podczas pisania.
- Cena sprzedaży części była tylko podglądem. Można ją teraz poprawić ręcznie; zakup i narzut nadal przeliczają sprzedaż.
- Łączna kwota była zaokrąglana inaczej niż widoczne kwoty wierszy. PDF, podgląd i edytor używają wspólnego zaokrąglenia do groszy.
- Komunikat „zapisano” pojawiał się przed zapisem AsyncStorage. Zapis, ustawienia i usuwanie są teraz potwierdzane dopiero po udanym zapisie lokalnym. Błąd zachowuje poprzedni stan i umożliwia ponowienie.
- Równoległe operacje zapisu są kolejkowane. Ponowne naciśnięcie zapisu tego samego szkicu nie tworzy kolejnego dokumentu.
- Nieprawidłowy odczyt historii blokuje nadpisywanie. Oryginalny klucz pamięci pozostaje bez zmian.
- Uruchamianie mowy mogło pozostawić zablokowany ekran podczas oczekiwania na uprawnienia. Limit czasu działa od rozpoczęcia próby; przejście w tło zwalnia sesję i zachowuje dostępny tekst.
- Udostępnianie PDF w przeglądarce mogło najpierw otworzyć drukowanie, a potem pokazać błąd. Udostępnianie pliku jest wyświetlane na telefonie; przeglądarka korzysta z drukowania/zapisu PDF.
- Dopuszczono obrót urządzenia i zawijanie pól liczb na wąskich ekranach. Wielkość przycisków kategorii zwiększono do 48 punktów.

## Bloker kompilacji Android — niepotwierdzona naprawa

Poprzedni log wskazywał `:expo-speech-recognition:compileDebugKotlin`, ale nie zawierał właściwych błędów kompilatora `e:`. Potwierdzona w historii kompatybilność: Expo SDK 53 → `expo-speech-recognition` 2.x; wydanie oznaczone `sdk-53` to 2.1.5. Nie odczytano aktualnie zainstalowanych wersji: dostęp do package.json jest zablokowany, a edytor nie ma terminala. Nie zmieniono chronionych plików zależności.

Dodano lokalny plugin prebuild, który sprawdza zgodność głównych wersji przed kompilacją Kotlin. Nie instaluje pakietów, nie modyfikuje package.json, nie usuwa mowy, nie dotyczy przeglądarkowego Live Preview i nie dowodzi poprawnej kompilacji. Wykryta niezgodność zatrzyma prebuild z konkretną instrukcją zamiast dopuszczać ją do kompilatora.

Po eksporcie źródeł, w istniejącym środowisku Node projektu:

```sh
npm ls expo expo-speech-recognition
node scripts/check-core.cjs
npx tsc --noEmit
```

Jeśli Expo ma wersję 53, a moduł mowy nie jest 2.x:

```sh
npm install --save-exact expo-speech-recognition@2.1.5
```

Następnie wykonaj jedną czystą kompilację Android w swoim środowisku. `npx expo prebuild --clean --platform android` regeneruje natywne pliki — zabezpiecz własne zmiany Android przed użyciem. Nie odinstalowuj aplikacji i nie czyść jej danych: historia jest lokalna. Ponowne kompilowanie bez poprawienia zależności nie jest testem rozwiązania.

## Poprawka przekazana z Codexa — zakres przeniesienia

Dodano `eas.json` z profilem `preview`, dystrybucją wewnętrzną i typem Android `apk`, zgodnie z przekazanym diffem. Ten profil dotyczy kompilacji uruchomionej przez EAS; nie potwierdza, że przycisk pobierania OnSpace używa tego profilu, i nie zmienia wersji bibliotek.

`package.json`, plik blokady zależności i `.gitignore` są chronione w tym edytorze. Nie przeniesiono wpisów `expo-speech-recognition: 2.1.5`, `ajv: 8.20.0` ani reguł ignorowania `.env`. Nie zweryfikowano konieczności dodania `ajv`; wcześniejszy log dotyczył kompilacji Kotlin modułu mowy, a nie walidatora JSON.

Przypięcie modułu mowy trzeba wykonać w Codexie lub lokalnie, w katalogu projektu, razem z aktualizacją pliku blokady:

```sh
npm install --save-exact expo-speech-recognition@2.1.5
npm ls expo expo-speech-recognition
node scripts/check-core.cjs
npx tsc --noEmit
```

Po sprawdzeniu zależności można uruchomić kompilację na koncie Expo/EAS, po skonfigurowaniu projektu i poświadczeń Android:

```sh
npx eas-cli build --platform android --profile preview
```

Dodanie konfiguracji nie oznacza zbudowania APK ani usunięcia błędu Kotlin. Potrzebny jest wynik kompilacji i test mowy na zainstalowanej aplikacji. Reguły `.gitignore` nie usuwają plików `.env`, które były już śledzone przez Git; sekretów nie należy wklejać do czatu ani commitować.

## Minimalny test przed kolejnym wydaniem

1. Po poprawieniu zależności wykonaj sprawdzenie typów i testy lokalne, a dopiero potem kompilację. Jeśli nadal nie działa, zachowaj konkretne linie `e:` z logu Kotlin.
2. Na zainstalowanym APK: przyznaj i odmów uprawnień; podyktuj po polsku, zatrzymaj, przejdź w tło, wróć i powtórz. Sprawdź czy tekst i interfejs pozostają dostępne. Expo Go/stary klient podglądu nie dołącza nowego modułu natywnego.
3. Użyj opisu `Wymiana oleju, 1.5 godziny robocizny, stawka 150 zł. Olej, cena zakupu 100,50 zł.`. Przy narzucie 25% oczekiwane: robocizna 225 zł, olej 125,63 zł, razem 350,63 zł.
4. Zmień ceny, wróć do opisu, popraw go i wybierz „Zachowaj pozycje”. Sprawdź brak utraty ręcznych poprawek. Zmień kategorię i cenę sprzedaży.
5. Zapisz, zamknij i otwórz aplikację. Sprawdź historię, ustawienia oraz filtr rejestracji. Zweryfikuj zapis i usuwanie także przy błędzie pamięci.
6. Na telefonie wygeneruj PDF z polskimi znakami i logo; porównaj sumę z ekranem. Otwórz wiadomość WhatsApp, a PDF dołącz w osobnym systemowym oknie udostępniania. Link `wa.me` sam nie dołącza pliku.
7. Sprawdź szerokość 320 punktów i obrót telefonu. Na iOS wykonaj osobny test: wynik Android nie potwierdza działania iOS.

## Usprawnienia intuicyjności — bieżąca wersja

Cel interfejsu: mechanik podczas obsługi naprawy szybko identyfikuje pojazd, sprawdza koszty i przekazuje czytelny dokument klientowi; interfejs ma dawać poczucie kontroli, spokoju i przejrzystości. Zachowano matowe, jasne powierzchnie, warsztatową zieleń oraz wyróżnione rejestracje i kwoty brutto.

- Główny przycisk tworzenia wyceny jest nad statystykami. Dane warsztatu otwierają ustawienia bez szukania odpowiedniej zakładki.
- Marka, model i opcjonalna rejestracja są podawane w pierwszym kroku. Następne ekrany przypominają, którego pojazdu dotyczy szkic.
- Kroki mają jasne nazwy: Pojazd → Opis → Ceny → Zapis. Zakończone kroki umożliwiają powrót bez usuwania pozycji; ochrona ręcznych cen przy zmianie opisu nadal obowiązuje.
- Zamknięcie szkicu przyciskiem w nagłówku lub systemowym przyciskiem Wstecz na Androidzie wymaga potwierdzenia, jeżeli szkic ma dane. Gest cofania iOS jest wyłączony na tym ekranie. Nie jest to automatyczny zapis szkicu i nie chroni przed zamknięciem procesu aplikacji ani nawigacją przyciskami przeglądarki.
- Dyktowanie nadal działa przez przycisk mikrofonu w aplikacji. Dodano jednoznaczny wybór pisania ręcznego i rozwijaną pomoc. Nie zmieniono modułu natywnego ani nie przywrócono OnSpace AI.
- Pola mają widoczny stan fokusu; błędy nazw, ilości i cen są przy odpowiednich polach. Pozycje wymagające uzupełnienia są oznaczone także tekstem. Dodawanie pracy, części i materiału ma osobne przyciski.
- Podsumowanie przed zapisem pokazuje osobno robociznę, części, materiały oraz sumę brutto. Telefon klienta pozostaje opcjonalny.
- Wyszukiwanie obsługuje markę/model, rejestrację i numer kosztorysu, także bez polskich znaków. Dostępne są czyszczenie zapytania i wyzerowanie filtrów. Na szerokich ekranach lista ma dwie kolumny.
- Ustawienia pokazują na żywo przykładową cenę godziny pracy i części kupionej za 100 zł. Widać, czy zmiany są niezapisane. Dodatkowe dane i pomoc są rozwijane.
- Na telefonie „Udostępnij kosztorys PDF” przygotowuje plik i otwiera systemowe udostępnianie w jednym działaniu. Nie wysyła dokumentu samodzielnie. Wiadomość WhatsApp jest oddzielną, opcjonalną funkcją bez załącznika. Przeglądarka nadal korzysta z okna drukowania.

### Kontrole dodane i testy do wykonania

Rozszerzono `scripts/check-core.cjs` o wyszukiwanie z polskimi znakami, rejestracje ze spacjami, numery dokumentów, podsumowania kategorii i oznaczanie brakujących danych. Testów nie wykonano w edytorze; nie ma tu terminala ani urządzenia. Sprawdzenie typów wymaga `npx tsc --noEmit` w wyeksportowanym projekcie.

W podglądzie można ręcznie sprawdzić: pojazd wymagany w pierwszym kroku; wpisany opis → poprawa pozycji → podsumowanie; pustą cenę i komunikat z numerem pozycji; cofnięcie do wcześniejszego kroku bez utraty cen; potwierdzenie zamknięcia szkicu; wyszukiwanie i czyszczenie filtrów; zmieniane na żywo przykłady stawek. Na APK trzeba osobno sprawdzić mikrofon, systemowe Wstecz, udostępnianie PDF i przejście do WhatsApp.

Te zmiany nie rozwiązują blokera kompilacji `expo-speech-recognition` i nie są potwierdzeniem działania APK. Nie zmieniono chronionych zależności, klucza pamięci ani istniejących danych.

## Bez kosztów AI w obecnym przepływie

Dyktowanie wywołuje usługę systemową, a wyodrębnianie pozycji jest lokalne. Przejrzany przepływ aplikacji nie wywołuje starego serwisu OnSpace AI. Jego pliki i funkcję backendową pozostawiono bez kasowania. Nie wykonywano płatnych prób transkrypcji. Usługa telefonu/przeglądarki może wymagać internetu i nie gwarantuje pracy offline.
