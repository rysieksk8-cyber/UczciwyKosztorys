import { memo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { voiceLimits } from '@/constants/voice';
import { Field, Notice } from '@/components/ui/Controls';

interface VoicePanelProps {
  transcript: string;
  onChange: (value: string) => void;
  recording: boolean;
  busy: boolean;
  finishing: boolean;
  seconds: number;
  onRecord: () => void;
  error: string;
  recognized: boolean;
  liveTranscript: string;
  available: boolean;
  checking: boolean;
  unavailableReason: string;
}

export const VoicePanel = memo(function VoicePanel({ transcript, onChange, recording, busy, finishing, seconds, onRecord, error, recognized, liveTranscript, available, checking, unavailableReason }: VoicePanelProps) {
  const microphoneDisabled = busy || checking || !available;
  const time = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  return (
    <View style={styles.root}>
      <View style={styles.panel}>
        <Text style={styles.kicker}>MOWA SYSTEMOWA · POLSKI</Text>
        <Pressable
          onPress={onRecord}
          disabled={microphoneDisabled}
          accessibilityRole="button"
          accessibilityState={{ disabled: microphoneDisabled, busy: busy || checking }}
          accessibilityLabel={checking ? 'Sprawdzanie dostępności dyktowania' : !available ? 'Dyktowanie niedostępne w tej wersji aplikacji' : recording ? 'Zatrzymaj dyktowanie' : finishing ? 'Kończenie rozpoznawania mowy' : 'Rozpocznij dyktowanie opisu po polsku'}
          accessibilityHint={!available && !checking ? unavailableReason : undefined}
          style={({ pressed }) => [styles.outer, recording ? styles.recording : null, microphoneDisabled ? styles.disabled : null, pressed ? styles.pressed : null]}
        >
          <View style={styles.mic}>
            {busy || checking ? <ActivityIndicator color={colors.primaryDark} /> : <Feather name={!available ? 'mic-off' : recording ? 'square' : 'mic'} size={38} color={colors.primaryDark} />}
          </View>
        </Pressable>
        <Text accessibilityLiveRegion="polite" style={styles.title}>{checking ? 'Sprawdzanie dyktowania…' : !available ? 'Dyktowanie niedostępne' : recording ? time : finishing ? 'Kończenie dyktowania…' : busy ? 'Uruchamianie mikrofonu…' : 'Opowiedz, co zrobiłeś'}</Text>
        <Text style={styles.caption}>{checking ? 'Sprawdzamy funkcje zainstalowanej wersji aplikacji.' : !available ? 'Możesz wpisać opis poniżej i dokończyć kosztorys. Instrukcja uruchomienia mowy znajduje się poniżej.' : recording ? 'Mów po polsku. Wynik pojawia się na żywo. Dotknij mikrofonu, aby zakończyć.' : finishing ? 'Czekamy na końcowy wynik usługi systemowej.' : 'Dotknij mikrofonu i zacznij mówić po pojawieniu się licznika. Bez połączenia z OnSpace AI.'}</Text>
        {available ? <Text style={styles.limit}>Maks. {voiceLimits.maxSeconds / 60} min · system może zakończyć po ciszy</Text> : null}
        <View style={styles.example}>
          <Feather name="message-square" size={18} color={colors.subtle} />
          <Text style={styles.exampleText}>„Przegląd Octavii, wymiana przednich klocków i łożyska…”</Text>
        </View>
      </View>
      {!available && !checking && unavailableReason ? <View accessibilityLiveRegion="polite"><Notice error>{unavailableReason}</Notice></View> : null}
      {liveTranscript ? <View style={styles.livePanel}><Text style={styles.liveLabel}>WYNIK NA ŻYWO · DO SPRAWDZENIA</Text><Text style={styles.liveText}>{liveTranscript}</Text></View> : null}
      <Notice>Rozpoznawanie korzysta z usługi telefonu lub przeglądarki, bez rozliczeń OnSpace AI. Usługa może wymagać internetu i przesyłać głos do Apple lub Google. Aplikacja nie zapisuje audio.</Notice>
      <Text style={styles.compatibility}>Moduł mowy jest dodawany przy kompilacji APK lub aplikacji iOS, nie przy odświeżeniu podglądu. W przeglądarce obsługa zależy od Web Speech API i uprawnień mikrofonu.</Text>
      {error ? <View accessibilityLiveRegion="polite"><Notice error>{error}</Notice></View> : null}
      {recognized ? <Notice icon="check-circle">Tekst został dopisany do opisu. Sprawdź nazwy części, liczby i ceny. Możesz poprawić tekst lub podyktować dalszą część.</Notice> : null}
      <Field
        label="Opis pracy — sprawdź i popraw"
        placeholder="Podyktuj opis lub wpisz go ręcznie. Np. Wymiana oleju, 1 godzina robocizny. Olej, cena zakupu 100 zł."
        multiline
        editable={!recording && !busy}
        value={transcript}
        onChangeText={onChange}
        hint="Po zakończeniu dyktowania możesz dowolnie poprawić tekst. Kolejna wypowiedź zostanie dopisana, bez usuwania Twoich poprawek. Pozycje wyodrębni lokalny parser; nieznane ceny uzupełnisz ręcznie."
      />
    </View>
  );
});

const styles = StyleSheet.create({
  root: { gap: spacing.md },
  panel: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.lg, alignItems: 'center', gap: spacing.md },
  kicker: { color: colors.subtle, fontSize: typography.small, letterSpacing: 1.5, fontWeight: '600', includeFontPadding: false },
  outer: { width: 136, height: 136, borderRadius: 68, backgroundColor: colors.primaryDark, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginVertical: spacing.sm },
  recording: { borderColor: colors.danger },
  disabled: { opacity: 0.65 },
  pressed: { opacity: 0.7, transform: [{ scale: 0.97 }] },
  mic: { width: 96, height: 96, borderRadius: 48, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  title: { color: colors.text, fontSize: typography.title, fontWeight: '700', textAlign: 'center', includeFontPadding: false },
  caption: { color: colors.subtle, fontSize: typography.body, textAlign: 'center', lineHeight: 26 },
  limit: { color: colors.subtle, fontSize: typography.small, textAlign: 'center' },
  example: { flexDirection: 'row', gap: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md, marginTop: spacing.sm },
  exampleText: { color: colors.subtle, fontSize: typography.body, fontStyle: 'italic', lineHeight: 26, flex: 1 },
  livePanel: { backgroundColor: colors.primaryDark, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, gap: spacing.sm },
  liveLabel: { color: colors.primary, fontSize: typography.small, fontWeight: '600', includeFontPadding: false },
  liveText: { color: colors.text, fontSize: typography.body, lineHeight: 26, includeFontPadding: false },
  compatibility: { color: colors.subtle, fontSize: typography.label, lineHeight: 24, includeFontPadding: false },
});
