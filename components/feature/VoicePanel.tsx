import { memo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { voiceLimits } from '@/constants/voice';
import { Button, Field, Notice } from '@/components/ui/Controls';

interface VoicePanelProps {
  transcript: string;
  onChange: (value: string) => void;
  recording: boolean;
  busy: boolean;
  transcribing: boolean;
  seconds: number;
  onRecord: () => void;
  error: string;
  canRetry: boolean;
  onRetry: () => void;
  recognized: boolean;
}

export const VoicePanel = memo(function VoicePanel({ transcript, onChange, recording, busy, transcribing, seconds, onRecord, error, canRetry, onRetry, recognized }: VoicePanelProps) {
  const time = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  return (
    <View style={styles.root}>
      <View style={styles.panel}>
        <Text style={styles.kicker}>ONSPACE AI · JĘZYK POLSKI</Text>
        <Pressable
          onPress={onRecord}
          disabled={busy}
          accessibilityRole="button"
          accessibilityState={{ disabled: busy, busy }}
          accessibilityLabel={recording ? 'Zatrzymaj nagrywanie i rozpoznaj mowę' : transcribing ? 'Rozpoznawanie polskiej mowy' : 'Rozpocznij nagrywanie opisu pracy'}
          style={({ pressed }) => [styles.outer, recording ? styles.recording : null, busy ? styles.disabled : null, pressed ? styles.pressed : null]}
        >
          <View style={styles.mic}>
            {busy ? <ActivityIndicator color={colors.primaryDark} /> : <Feather name={recording ? 'square' : 'mic'} size={38} color={colors.primaryDark} />}
          </View>
        </Pressable>
        <Text accessibilityLiveRegion="polite" style={styles.title}>{recording ? time : transcribing ? 'Rozpoznawanie mowy…' : busy ? 'Przygotowywanie nagrania…' : 'Opowiedz, co zrobiłeś'}</Text>
        <Text style={styles.caption}>{recording ? 'Nagrywanie trwa. Dotknij, aby zatrzymać i rozpoznać tekst.' : transcribing ? 'OnSpace AI przepisuje Twoją wypowiedź po polsku. Poczekaj na wynik.' : 'Dotknij mikrofonu, nagraj opis i zatrzymaj. Tekst pojawi się poniżej.'}</Text>
        <Text style={styles.limit}>Do {voiceLimits.maxSeconds / 60} minut · automatyczne zakończenie</Text>
        <View style={styles.example}>
          <Feather name="message-square" size={18} color={colors.subtle} />
          <Text style={styles.exampleText}>„Przegląd Octavii, wymiana przednich klocków i łożyska…”</Text>
        </View>
      </View>
      <Notice>Nagranie jest wysyłane do OnSpace AI w celu rozpoznania mowy. Wymagany jest internet. Aplikacja nie zapisuje audio w historii kosztorysów.</Notice>
      {error ? <View accessibilityLiveRegion="polite" style={styles.feedback}><Notice error>{error}</Notice>{canRetry ? <Button title="Ponów rozpoznawanie tego nagrania" icon="refresh-cw" secondary disabled={recording || busy} onPress={onRetry} /> : null}</View> : null}
      {recognized && !error ? <Notice icon="check-circle">Mowa została rozpoznana. Sprawdź nazwy części, liczby i ceny. Możesz poprawić tekst przed przejściem dalej.</Notice> : null}
      <Field
        label="Opis pracy — sprawdź i popraw"
        placeholder="Nagraj opis lub wpisz go ręcznie. Np. Wymiana oleju, 1 godzina robocizny. Olej, cena zakupu 100 zł."
        multiline
        editable={!recording && !busy}
        value={transcript}
        onChangeText={onChange}
        hint="Tekst możesz dowolnie edytować. Kolejne nagranie dopisze tekst, nie usunie Twoich poprawek. Pozycje wyodrębni lokalny parser; nieznane ceny uzupełnisz ręcznie."
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
  feedback: { gap: spacing.md },
});
