# Kosztorys Mechanika — przegląd jakości

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

## Minimalny test przed kolejnym wydaniem

1. Po poprawieniu zależności wykonaj sprawdzenie typów i testy lokalne, a dopiero potem kompilację. Jeśli nadal nie działa, zachowaj konkretne linie `e:` z logu Kotlin.
2. Na zainstalowanym APK: przyznaj i odmów uprawnień; podyktuj po polsku, zatrzymaj, przejdź w tło, wróć i powtórz. Sprawdź czy tekst i interfejs pozostają dostępne. Expo Go/stary klient podglądu nie dołącza nowego modułu natywnego.
3. Użyj opisu `Wymiana oleju, 1.5 godziny robocizny, stawka 150 zł. Olej, cena zakupu 100,50 zł.`. Przy narzucie 25% oczekiwane: robocizna 225 zł, olej 125,63 zł, razem 350,63 zł.
4. Zmień ceny, wróć do opisu, popraw go i wybierz „Zachowaj pozycje”. Sprawdź brak utraty ręcznych poprawek. Zmień kategorię i cenę sprzedaży.
5. Zapisz, zamknij i otwórz aplikację. Sprawdź historię, ustawienia oraz filtr rejestracji. Zweryfikuj zapis i usuwanie także przy błędzie pamięci.
6. Na telefonie wygeneruj PDF z polskimi znakami i logo; porównaj sumę z ekranem. Otwórz wiadomość WhatsApp, a PDF dołącz w osobnym systemowym oknie udostępniania. Link `wa.me` sam nie dołącza pliku.
7. Sprawdź szerokość 320 punktów i obrót telefonu. Na iOS wykonaj osobny test: wynik Android nie potwierdza działania iOS.

## Bez kosztów AI w obecnym przepływie

Dyktowanie wywołuje usługę systemową, a wyodrębnianie pozycji jest lokalne. Przejrzany przepływ aplikacji nie wywołuje starego serwisu OnSpace AI. Jego pliki i funkcję backendową pozostawiono bez kasowania. Nie wykonywano płatnych prób transkrypcji. Usługa telefonu/przeglądarki może wymagać internetu i nie gwarantuje pracy offline.
