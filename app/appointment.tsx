import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '@/components/layout/Screen';
import { Button, Chip, Field, Notice } from '@/components/ui/Controls';
import { Disclosure } from '@/components/ui/Disclosure';
import { useAppointment } from '@/hooks/useAppointment';
import { useViewport } from '@/hooks/useViewport';
import { appointmentDurations } from '@/services/calendar';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { paperStyles } from '@/constants/styles';

export function AppointmentPage() {
  const params = useLocalSearchParams<{ estimateId?: string | string[] }>();
  const estimateId = Array.isArray(params.estimateId) ? params.estimateId[0] : params.estimateId;
  const router = useRouter();
  const { wide } = useViewport();
  const { draft, errors, error, opened, cancelled, busy, loaded, unavailable, change, chooseDay, open, summary, timeZone, today, tomorrow } = useAppointment(estimateId);
  const web = Platform.OS === 'web';
  const openTitle = web ? 'Otwórz podgląd Google w przeglądarce' : 'Otwórz aplikację kalendarza';
  if (!loaded) return <Screen><ActivityIndicator color={colors.primary} /></Screen>;
  if (unavailable) return <Screen><Notice error>Nie znaleziono kosztorysu. Możesz utworzyć wizytę bez powiązanego dokumentu.</Notice><Button title="Nowa wizyta" icon="calendar" onPress={() => router.replace('/appointment')} /></Screen>;
  const footer = <View style={styles.footer}>
    {error ? <Notice error compact>{error}</Notice> : null}
    <Text style={styles.footerHint}>{opened ? 'Sprawdź zapis wizyty w swoim kalendarzu.' : web ? 'Na komputerze formularz otworzy się w przeglądarce.' : 'Zapis zatwierdzasz w kalendarzu telefonu.'}</Text>
    <Button title={opened ? 'Wróć do kosztorysów' : openTitle} icon={opened ? 'arrow-left' : web ? 'external-link' : 'calendar'} loading={busy} disabled={busy} onPress={opened ? () => router.canGoBack() ? router.back() : router.replace('/(tabs)') : open} />
  </View>;
  return <Screen keyboard footer={footer}>
    <View style={[paperStyles.hero, styles.hero]}>
      <View style={styles.heading}><Feather name="calendar" size={24} color={colors.primary} /><Text style={styles.kicker}>TERMIN NAPRAWY</Text></View>
      <Text style={styles.title}>Zaplanuj wizytę</Text>
      <Text style={styles.body}>Pojazd, klient i termin — razem w Twoim kalendarzu.</Text>
      {draft.estimateNumber ? <View style={styles.badge}><Feather name="file-text" size={16} color={colors.primary} /><Text style={styles.badgeText}>{draft.estimateNumber}</Text></View> : null}
    </View>
    <Notice icon="calendar">{web ? 'Podgląd komputerowy otwiera stronę Google.' : Platform.OS === 'android' ? 'Wybierz Kalendarz Google i właściwe konto w formularzu kalendarza telefonu.' : 'Na iPhonie wybierz konto Google w systemowym formularzu kalendarza.'}</Notice>
    {cancelled ? <Notice>Dodawanie wizyty zostało anulowane. Dane formularza pozostały bez zmian.</Notice> : null}
    {opened ? <View style={[paperStyles.card, styles.card]} accessibilityLiveRegion="polite">
      <View style={styles.heading}><Feather name="calendar" size={20} color={colors.primary} /><Text style={styles.sectionTitle}>Formularz kalendarza otwarty</Text></View>
      <Text style={styles.body}>W kalendarzu wybierz właściwe konto Google i naciśnij „Zapisz”. Po powrocie sprawdź, czy wydarzenie jest widoczne. Jeśli wizyta jest już zapisana, nie twórz jej ponownie.</Text>
      <Button title="Otwórz formularz ponownie" secondary icon={web ? 'external-link' : 'calendar'} loading={busy} disabled={busy} onPress={open} />
    </View> : null}
    <View style={[paperStyles.card, styles.card]}>
      <View style={styles.heading}><Feather name="tool" size={20} color={colors.primary} /><Text style={styles.sectionTitle}>Pojazd i klient</Text></View>
      <Field label="Marka i model pojazdu *" value={draft.vehicle} onChangeText={vehicle => change({ vehicle })} error={errors.vehicle} editable={!busy} maxLength={100} placeholder="np. Škoda Octavia 1.6 TDI" />
      <Field label="Numer rejestracyjny (opcjonalnie)" value={draft.plate} onChangeText={plate => change({ plate })} error={errors.plate} editable={!busy} autoCapitalize="characters" maxLength={20} placeholder="np. WWA 12345" />
      <Field label="Imię lub nazwa klienta (opcjonalnie)" value={draft.client} onChangeText={client => change({ client })} error={errors.client} editable={!busy} maxLength={100} placeholder="np. Jan Kowalski" />
      <Field label="Telefon klienta (opcjonalnie)" value={draft.phone} onChangeText={phone => change({ phone })} error={errors.phone} editable={!busy} keyboardType="phone-pad" maxLength={30} placeholder="np. +48 500 600 700" hint="Dane kontaktowe trafią tylko do opisu wydarzenia, nie do zaproszenia dla klienta." />
    </View>
    <View style={[paperStyles.card, styles.card]}>
      <View style={styles.heading}><Feather name="clock" size={20} color={colors.primary} /><Text style={styles.sectionTitle}>Kiedy przyjeżdża?</Text></View>
      <View style={styles.chips}><Chip title="Dzisiaj" selected={draft.date === today} onPress={() => chooseDay(0)} /><Chip title="Jutro" selected={draft.date === tomorrow} onPress={() => chooseDay(1)} /></View>
      <View style={[styles.dateFields, wide ? styles.dateFieldsWide : null]}>
        <View style={wide ? styles.dateField : undefined}><Field label="Data wizyty *" value={draft.date} onChangeText={date => change({ date })} error={errors.date} editable={!busy} keyboardType="numbers-and-punctuation" maxLength={10} placeholder="DD.MM.RRRR" hint="Dzień.miesiąc.rok, np. 20.11.2026." /></View>
        <View style={wide ? styles.dateField : undefined}><Field label="Godzina rozpoczęcia *" value={draft.time} onChangeText={time => change({ time })} error={errors.time} editable={!busy} keyboardType="numbers-and-punctuation" maxLength={5} placeholder="09:30" hint="Format 24-godzinny, np. 14:30." /></View>
      </View>
      <Text style={styles.label}>Przewidywany czas wizyty</Text>
      <View style={styles.chips}><Chip title="30 min" selected={draft.duration === appointmentDurations[0]} onPress={() => change({ duration: 30 })} /><Chip title="1 godz." selected={draft.duration === appointmentDurations[1]} onPress={() => change({ duration: 60 })} /><Chip title="2 godz." selected={draft.duration === appointmentDurations[2]} onPress={() => change({ duration: 120 })} /><Chip title="3 godz." selected={draft.duration === appointmentDurations[3]} onPress={() => change({ duration: 180 })} /></View>
      {errors.duration ? <Notice error>{errors.duration}</Notice> : null}
      <View style={styles.preview}>
        <Text style={styles.kicker}>PODGLĄD WYDARZENIA</Text>
        <Text style={styles.sectionTitle}>{draft.vehicle.trim() ? `Naprawa · ${draft.vehicle.trim()}` : 'Naprawa pojazdu'}</Text>
        {draft.plate.trim() ? <Text style={styles.plate}>{draft.plate.trim()}</Text> : null}
        <Text style={styles.previewTime}>{summary}</Text>
        <Text style={styles.hint}>Czas według strefy telefonu{timeZone ? `: ${timeZone}` : ''}. Sprawdź termin także w Google.</Text>
      </View>
    </View>
    <View style={[paperStyles.card, styles.card]}>
      <View style={styles.heading}><Feather name="align-left" size={20} color={colors.primary} /><Text style={styles.sectionTitle}>Szczegóły wizyty</Text></View>
      <Field label="Zakres prac lub uwagi (opcjonalnie)" value={draft.description} onChangeText={description => change({ description })} error={errors.description} editable={!busy} multiline maxLength={500} placeholder="np. Wymiana oleju i filtrów. Klient zostawia samochód rano." />
      <Field label="Miejsce wizyty (opcjonalnie)" value={draft.location} onChangeText={location => change({ location })} error={errors.location} editable={!busy} maxLength={200} placeholder="Adres warsztatu" hint="Adres jest uzupełniany z ustawień warsztatu, jeśli został zapisany." />
    </View>
    <Disclosure title="Jak działa połączenie z Google?" icon="info">
      <Text style={styles.body}>{web
        ? 'To podgląd komputerowy: tutaj otwiera się strona Google. W nowym APK formularz otworzy się w aplikacji kalendarza bez przeglądarki.'
        : Platform.OS === 'android'
          ? 'Android otworzy domyślną aplikację kalendarza lub zapyta o wybór. Wskaż Kalendarz Google. Jeśli otwiera się inny kalendarz, zmień domyślną obsługę w ustawieniach telefonu. Aplikacja nie wymusza konkretnego kalendarza.'
          : 'Na iPhonie otwieramy systemowy formularz, nie aplikację Google. Wybierz kalendarz konta Google dodanego w ustawieniach iOS, aby wizyta pojawiła się także w Kalendarzu Google.'}</Text>
      <Notice>{web ? 'W podglądzie potrzebujesz internetu i konta Google w przeglądarce.' : 'Na telefonie potrzebujesz aplikacji kalendarza i skonfigurowanego konta Google. Synchronizacja z Google zależy od ustawień telefonu i dostępu do internetu. Przeglądarka nie jest otwierana, także przy błędzie.'} Dane przekazujemy dopiero po naciśnięciu przycisku. Nie odczytujemy kalendarza, nie sprawdzamy wolnych terminów, nie potwierdzamy zapisu ani nie wysyłamy zaproszeń klientowi.</Notice>
    </Disclosure>
  </Screen>;
}
export { AppointmentPage as default };
const styles = StyleSheet.create({
  hero: { gap: spacing.md },
  heading: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  kicker: { color: colors.primary, fontSize: typography.small, fontWeight: '600', letterSpacing: 1, includeFontPadding: false },
  title: { color: colors.text, fontSize: typography.title, lineHeight: 32, fontWeight: '700', includeFontPadding: false },
  body: { color: colors.subtle, fontSize: typography.body, lineHeight: 26 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm }, badgeText: { color: colors.primary, fontSize: typography.label, fontWeight: '600', flexShrink: 1 },
  card: { padding: spacing.md, gap: spacing.md },
  sectionTitle: { color: colors.text, fontSize: typography.section, fontWeight: '600', includeFontPadding: false, flexShrink: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  label: { color: colors.subtle, fontSize: typography.label, fontWeight: '500' },
  dateFields: { gap: spacing.md }, dateFieldsWide: { flexDirection: 'row' }, dateField: { flex: 1 },
  preview: { backgroundColor: colors.primaryDark, borderRadius: radius.sm, padding: spacing.md, gap: spacing.sm },
  previewTime: { color: colors.primary, fontSize: typography.body, fontWeight: '600', lineHeight: 26 },
  plate: { color: colors.text, fontSize: typography.body, fontWeight: '600', letterSpacing: 1 },
  hint: { color: colors.subtle, fontSize: typography.label, lineHeight: 22 }, footerHint: { color: colors.subtle, fontSize: typography.label, lineHeight: 22, textAlign: 'center' }, footer: { gap: spacing.sm },
});
