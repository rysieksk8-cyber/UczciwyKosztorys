import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { Screen } from '@/components/layout/Screen';
import { Button, Field, Notice } from '@/components/ui/Controls';
import { Disclosure } from '@/components/ui/Disclosure';
import { useSettings } from '@/hooks/useSettings';
import { money } from '@/services/estimates';
import { colors, radius, spacing, typography } from '@/constants/theme';

export function SettingsPage() {
  const { draft, rate, markup, error, saved, saving, loaded, dirty, previewRate, previewPartPrice, change, changeRate, changeMarkup, pickLogo, save } = useSettings();
  const footer = <View style={styles.footer}>{error ? <Notice error>{error}</Notice> : null}<Text accessibilityLiveRegion="polite" style={styles.footerHint}>{saving ? 'Zapisujemy ustawienia…' : dirty ? 'Masz niezapisane zmiany.' : saved ? 'Zmiany zapisane na tym urządzeniu.' : 'Te ustawienia dotyczą nowych kosztorysów.'}</Text><Button title={saved && !dirty ? 'Ustawienia zapisane' : 'Zapisz ustawienia'} icon={saved && !dirty ? 'check' : 'save'} loading={saving} disabled={!loaded || saving || !dirty} onPress={save} /></View>;
  return <Screen tab keyboard footer={footer}>
    <View style={styles.heading}><Text style={styles.kicker}>DANE I ZASADY WYCENY</Text><Text style={styles.title}>Twój warsztat</Text><Text style={styles.description}>Ustaw raz. Nazwa, logo i stawki będą gotowe przy kolejnej wycenie.</Text></View>
    <View style={styles.card}>
      <View style={styles.sectionHeader}><Feather name="tool" size={20} color={colors.primary} /><Text style={styles.sectionTitle}>Dane na kosztorysie</Text></View>
      <Field label="Nazwa warsztatu *" value={draft.name} editable={loaded && !saving} onChangeText={name => change({ name })} placeholder="np. Auto Serwis Kowalski" />
      <View style={styles.logoRow}>{draft.logo ? <Image source={{ uri: draft.logo }} style={styles.logo} contentFit="contain" transition={200} /> : <View style={styles.logoEmpty}><Feather name="image" size={26} color={colors.subtle} /></View>}<View style={styles.logoActions}><Button title={draft.logo ? 'Zmień logo' : 'Dodaj logo'} secondary compact disabled={!loaded || saving} icon="upload" onPress={pickLogo} />{draft.logo ? <Button title="Usuń logo" secondary compact danger disabled={!loaded || saving} onPress={() => change({ logo: '' })} /> : <Text style={styles.hint}>Opcjonalnie · pojawi się na PDF.</Text>}</View></View>
      <Disclosure title="Adres i telefon warsztatu" icon="map-pin"><Field label="Adres (opcjonalnie)" value={draft.address} editable={loaded && !saving} onChangeText={address => change({ address })} placeholder="Ulica, kod pocztowy, miejscowość" /><Field label="Telefon warsztatu (opcjonalnie)" keyboardType="phone-pad" value={draft.phone} editable={loaded && !saving} onChangeText={phone => change({ phone })} placeholder="+48 500 600 700" /></Disclosure>
    </View>
    <View style={styles.card}>
      <View style={styles.sectionHeader}><Feather name="sliders" size={20} color={colors.primary} /><Text style={styles.sectionTitle}>Domyślne stawki</Text></View>
      <Field label="Robocizna brutto (zł za godzinę)" keyboardType="decimal-pad" editable={loaded && !saving} value={rate} onChangeText={changeRate} hint="Możesz wpisać grosze po przecinku, np. 150,50." />
      <Field label="Narzut na cenę zakupu (%)" keyboardType="decimal-pad" editable={loaded && !saving} value={markup} onChangeText={changeMarkup} hint="Dotyczy części i materiałów. 25% oznacza zakup 100 zł → sprzedaż 125 zł." />
      <View style={styles.example}><View style={styles.sectionHeader}><Feather name="eye" size={18} color={colors.primary} /><Text style={styles.exampleTitle}>Tak zadziałają Twoje stawki</Text></View><View style={styles.exampleRow}><Text style={styles.exampleLabel}>1 godzina pracy</Text><Text style={styles.examplePrice}>{previewRate !== null && previewRate > 0 ? money(previewRate) : '—'}</Text></View><View style={styles.exampleRow}><Text style={styles.exampleLabel}>Część kupiona za 100 zł</Text><Text style={styles.examplePrice}>{previewPartPrice !== null ? money(previewPartPrice) : '—'}</Text></View><Text style={styles.hint}>To podgląd obliczeń, nie pozycje dodane do kosztorysu.</Text></View>
      <Text style={styles.hint}>W każdej wycenie możesz ręcznie poprawić ceny. Zapisane wcześniej kosztorysy pozostaną bez zmian.</Text>
    </View>
    <Disclosure title="Gdzie zapisują się moje dane?" icon="hard-drive"><Text style={styles.description}>Kosztorysy i ustawienia są zapisane lokalnie, bez konta i synchronizacji. Usunięcie danych aplikacji lub jej odinstalowanie może usunąć historię. Nie czyść danych przy aktualizacji.</Text><Text style={styles.description}>Dyktowanie korzysta z mowy systemowej, bez OnSpace AI. Usługa telefonu lub przeglądarki może wymagać internetu i przesyłać głos do Apple lub Google. Aplikacja nie zapisuje audio.</Text></Disclosure>
  </Screen>;
}
export { SettingsPage as default };
const styles = StyleSheet.create({
  heading: { gap: spacing.sm }, kicker: { color: colors.primary, fontSize: typography.small, letterSpacing: 1, fontWeight: '600' }, title: { color: colors.text, fontSize: typography.title, fontWeight: '700', includeFontPadding: false }, description: { color: colors.subtle, fontSize: typography.body, lineHeight: 26 },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, gap: spacing.lg }, sectionHeader: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }, sectionTitle: { color: colors.text, fontSize: typography.section, fontWeight: '600', flexShrink: 1 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md }, logo: { width: 72, height: 72, backgroundColor: colors.raised, borderRadius: radius.sm }, logoEmpty: { width: 72, height: 72, backgroundColor: colors.raised, borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed', borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' }, logoActions: { flex: 1, gap: spacing.sm },
  hint: { color: colors.subtle, fontSize: typography.label, lineHeight: 23 }, example: { backgroundColor: colors.primaryDark, borderRadius: radius.sm, padding: spacing.md, gap: spacing.md }, exampleTitle: { color: colors.primary, fontSize: typography.body, fontWeight: '600', flexShrink: 1 }, exampleRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: spacing.sm }, exampleLabel: { color: colors.subtle, fontSize: typography.body }, examplePrice: { color: colors.primary, fontSize: typography.section, fontWeight: '700' }, footer: { gap: spacing.sm }, footerHint: { color: colors.subtle, fontSize: typography.label, textAlign: 'center', lineHeight: 22 },
});
