import { memo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { voiceLimits } from '@/constants/voice';
import { Button, Field, Notice } from '@/components/ui/Controls';
import { Disclosure } from '@/components/ui/Disclosure';
import { useVoicePanel } from '@/hooks/useVoicePanel';

interface VoicePanelProps {
  transcript: string; onChange: (value: string) => void; recording: boolean; busy: boolean;
  finishing: boolean; seconds: number; onRecord: () => void; error: string; recognized: boolean;
  liveTranscript: string; available: boolean; checking: boolean; unavailableReason: string;
}
export const VoicePanel = memo(function VoicePanel({ transcript, onChange, recording, busy, finishing, seconds, onRecord, error, recognized, liveTranscript, available, checking, unavailableReason }: VoicePanelProps) {
  const { mode, chooseVoice, chooseManual, keyboardOnly, descriptionRef, focusDescription } = useVoicePanel();
  if (keyboardOnly) return <View style={styles.root}>
    <View style={styles.keyboardPanel}>
      <View style={styles.keyboardHeading}><View style={styles.keyboardIcon}><Feather name="mic" size={24} color={colors.primary} /></View><View style={styles.manualText}><Text style={styles.kicker}>DYKTOWANIE KLAWIATURĄ</Text><Text style={styles.manualTitle}>Powiedz, co naprawiłeś</Text></View></View>
      <Text style={styles.caption}>W tej wersji używasz mikrofonu klawiatury telefonu zamiast przycisku nagrywania w aplikacji.</Text>
      <View style={styles.instructions}>
        <Text style={styles.help}>1. Dotknij pola opisu, aby otworzyć klawiaturę.</Text>
        <Text style={styles.help}>2. Dotknij mikrofonu na klawiaturze i mów po polsku.</Text>
        <Text style={styles.help}>3. Zakończ dyktowanie. Sprawdź nazwy, liczby i ceny.</Text>
      </View>
      <Button title="Otwórz klawiaturę" icon="edit-3" secondary onPress={focusDescription} />
    </View>
    <Field inputRef={descriptionRef} label="Opis wykonanej pracy" placeholder={'Np. Wymiana oleju, 1 godzina robocizny, stawka 150 zł.\nOlej, cena zakupu 100 zł.'} multiline autoCorrect autoCapitalize="sentences" keyboardType="default" value={transcript} onChangeText={onChange} hint="Możesz też pisać ręcznie. Oddziel prace i części nową linią; ceny uzupełnisz w kolejnym kroku." />
    <Disclosure title="Nie widzę mikrofonu na klawiaturze">
      <Text style={styles.help}>Na Androidzie sprawdź opcję „Pisanie głosowe” w ustawieniach klawiatury, np. Gboard. Zezwól klawiaturze na mikrofon i wybierz język polski. Położenie mikrofonu zależy od klawiatury.</Text>
      <Text style={styles.help}>Na iPhonie sprawdź Ustawienia → Ogólne → Klawiatura → Włącz dyktowanie. Użyj klawiatury z językiem polskim.</Text>
      <Text style={styles.help}>Na komputerze wpisz opis ręcznie. Jeśli telefon nie udostępnia dyktowania, również możesz pisać — nie blokuje to tworzenia kosztorysu.</Text>
    </Disclosure>
    <Disclosure title="Jak dyktować prace i ceny?">
      <Text style={styles.help}>Podaj nazwę pracy, czas i stawkę: „Wymiana oleju, 1 godzina, stawka 150 zł”. Części opisuj osobno: „Olej, cena zakupu 100 zł”. Po dyktowaniu dodaj nowe linie i popraw błędne liczby. Jeśli cena nie zostanie odczytana, wpiszesz ją w kroku „Ceny”.</Text>
      <Text style={styles.help}>Aplikacja otrzymuje tekst z klawiatury, nie nagrywa głosu i nie wywołuje OnSpace AI. Dyktowaniem zarządza dostawca klawiatury lub system telefonu; może wymagać internetu i przesyłać głos do swojej usługi.</Text>
    </Disclosure>
  </View>;
  const microphoneDisabled = busy || checking || !available;
  const locked = recording || busy;
  const time = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  return <View style={styles.root}>
    <View style={styles.modes}>
      <Pressable disabled={locked} onPress={chooseVoice} accessibilityRole="button" accessibilityState={{ selected: mode === 'voice', disabled: locked }} style={({ pressed }) => [styles.mode, mode === 'voice' ? styles.selected : null, pressed ? styles.pressed : null]}><Feather name="mic" size={18} color={mode === 'voice' ? colors.onPrimary : colors.subtle} /><Text style={[styles.modeText, mode === 'voice' ? styles.selectedText : null]}>Podyktuj</Text></Pressable>
      <Pressable disabled={locked} onPress={chooseManual} accessibilityRole="button" accessibilityState={{ selected: mode === 'manual', disabled: locked }} style={({ pressed }) => [styles.mode, mode === 'manual' ? styles.selected : null, pressed ? styles.pressed : null]}><Feather name="edit-3" size={18} color={mode === 'manual' ? colors.onPrimary : colors.subtle} /><Text style={[styles.modeText, mode === 'manual' ? styles.selectedText : null]}>Wpisz ręcznie</Text></Pressable>
    </View>
    {mode === 'voice' ? <View style={styles.panel}>
      <Text style={styles.kicker}>DYKTOWANIE PO POLSKU</Text>
      <Pressable onPress={onRecord} disabled={microphoneDisabled} accessibilityRole="button" accessibilityState={{ disabled: microphoneDisabled, busy: busy || checking }} accessibilityLabel={recording ? 'Zatrzymaj dyktowanie' : 'Rozpocznij dyktowanie po polsku'} accessibilityHint={!available && !checking ? unavailableReason : undefined} style={({ pressed }) => [styles.outer, recording ? styles.recording : null, microphoneDisabled ? styles.disabled : null, pressed ? styles.pressed : null]}>
        <View style={[styles.mic, recording ? styles.micRecording : null]}>{busy || checking ? <ActivityIndicator color={colors.onPrimary} /> : <Feather name={!available ? 'mic-off' : recording ? 'square' : 'mic'} size={36} color={colors.onPrimary} />}</View>
      </Pressable>
      <Text accessibilityLiveRegion="polite" style={styles.title}>{checking ? 'Sprawdzamy mikrofon…' : !available ? 'Dyktowanie niedostępne' : recording ? time : finishing ? 'Zapisujemy wypowiedź…' : busy ? 'Uruchamiamy mikrofon…' : 'Dotknij i zacznij mówić'}</Text>
      <Text style={styles.caption}>{!available && !checking ? 'W tej wersji możesz wpisać opis ręcznie. Szczegóły znajdziesz w pomocy poniżej.' : recording ? 'Mów spokojnie. Dotknij ponownie, aby zakończyć.' : finishing ? 'Poczekaj na końcowy tekst.' : 'Wymień prace, czas i ceny. Po nagraniu sprawdzisz tekst.'}</Text>
      {available ? <Text style={styles.limit}>Do {voiceLimits.maxSeconds / 60} minut · mowa systemowa, bez OnSpace AI</Text> : null}
    </View> : <View style={styles.manual}><Feather name="edit-3" size={22} color={colors.primary} /><View style={styles.manualText}><Text style={styles.manualTitle}>Opisz naprawę własnymi słowami</Text><Text style={styles.caption}>Każdą pracę lub część wpisz w osobnej linii. Ceny możesz dopisać teraz albo w kolejnym kroku.</Text></View></View>}
    {error ? <Notice error>{error}</Notice> : null}
    {liveTranscript ? <View style={styles.live}><Text style={styles.kicker}>ROZPOZNANY TEKST</Text><Text style={styles.liveText}>{liveTranscript}</Text></View> : null}
    {recognized ? <View accessibilityLiveRegion="polite" style={styles.confirmation}><Feather name="check-circle" size={18} color={colors.primary} /><Text style={styles.confirmationText}>Opis dopisany. Sprawdź nazwy, liczby i ceny.</Text></View> : null}
    <Field label={mode === 'manual' ? 'Opis wykonanej pracy' : 'Opis pracy — możesz poprawić tekst'} placeholder={'Np. Wymiana oleju, 1 godzina robocizny.\nOlej, cena zakupu 100 zł.'} multiline editable={!locked} value={transcript} onChangeText={onChange} hint="Nie znasz jeszcze ceny? Uzupełnisz ją w kroku „Ceny”." />
    <Disclosure title={!available && !checking ? 'Dlaczego dyktowanie nie działa?' : 'Jak uzyskać czytelny kosztorys?'}>
      {!available && !checking && unavailableReason ? <Notice error>{unavailableReason}</Notice> : null}
      <Text style={styles.help}>Podaj nazwę pracy, czas i stawkę, np. „Wymiana oleju, 1 godzina, stawka 150 zł”. Części opisuj osobno: „Olej, cena zakupu 100 zł”. Jeśli aplikacja nie odczyta ceny, wpiszesz ją samodzielnie.</Text>
      <Text style={styles.help}>Kolejna wypowiedź jest dopisywana — Twoje poprawki zostają. System może zakończyć dyktowanie po ciszy.</Text>
      <Text style={styles.help}>Mowa systemowa nie korzysta z rozliczeń OnSpace AI. Usługa telefonu może wymagać internetu i przesyłać głos do Apple lub Google. Aplikacja nie zapisuje audio. Nowy moduł mowy wymaga nowej kompilacji APK lub iOS; odświeżenie podglądu go nie dodaje.</Text>
    </Disclosure>
  </View>;
});
const styles = StyleSheet.create({
  keyboardPanel: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, gap: spacing.md },
  keyboardHeading: { flexDirection: 'row', alignItems: 'center', gap: spacing.md }, keyboardIcon: { width: 48, height: 48, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryDark }, instructions: { gap: spacing.sm },
  root: { gap: spacing.md }, modes: { flexDirection: 'row', gap: spacing.sm, backgroundColor: colors.raised, padding: spacing.xs, borderRadius: radius.sm },
  mode: { minHeight: 48, flex: 1, borderRadius: radius.sm, flexDirection: 'row', gap: spacing.sm, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.sm },
  selected: { backgroundColor: colors.primary }, modeText: { color: colors.subtle, fontSize: typography.label, fontWeight: '600' }, selectedText: { color: colors.onPrimary },
  panel: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.lg, alignItems: 'center', gap: spacing.md },
  kicker: { color: colors.primary, fontSize: typography.small, letterSpacing: 1, fontWeight: '600', includeFontPadding: false },
  outer: { width: 120, height: 120, borderRadius: radius.pill, backgroundColor: colors.primaryDark, alignItems: 'center', justifyContent: 'center' },
  recording: { backgroundColor: colors.dangerSurface }, micRecording: { backgroundColor: colors.danger },
  mic: { width: 88, height: 88, borderRadius: radius.pill, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.5 }, pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
  title: { color: colors.text, fontSize: typography.section, fontWeight: '700', textAlign: 'center', includeFontPadding: false },
  caption: { color: colors.subtle, fontSize: typography.body, lineHeight: 26 }, limit: { color: colors.subtle, fontSize: typography.small, textAlign: 'center' },
  manual: { flexDirection: 'row', gap: spacing.md, padding: spacing.md, backgroundColor: colors.primaryDark, borderRadius: radius.md }, manualText: { flex: 1, gap: spacing.sm },
  manualTitle: { color: colors.text, fontSize: typography.body, fontWeight: '700' }, live: { backgroundColor: colors.primaryDark, padding: spacing.md, gap: spacing.sm, borderRadius: radius.md },
  liveText: { color: colors.text, fontSize: typography.body, lineHeight: 26 }, confirmation: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  confirmationText: { color: colors.primary, fontSize: typography.label, flex: 1, lineHeight: 22 }, help: { color: colors.subtle, fontSize: typography.body, lineHeight: 26 },
});
