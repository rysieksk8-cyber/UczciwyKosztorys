import { useCallback } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAlert } from '@/template';
import { Screen } from '@/components/layout/Screen';
import { Button, Field, Notice } from '@/components/ui/Controls';
import { Disclosure } from '@/components/ui/Disclosure';
import { DocumentPreview } from '@/components/feature/DocumentPreview';
import { useWorkshop } from '@/hooks/useWorkshop';
import { useDocument } from '@/hooks/useDocument';
import { money, total } from '@/services/estimates';
import { colors, radius, spacing, typography } from '@/constants/theme';

export function EstimateDetailPage() {
  const { id, fresh } = useLocalSearchParams<{ id: string; fresh?: string }>();
  const { estimates, loaded, deleteEstimate, storageError } = useWorkshop();
  const estimate = estimates.find(item => item.id === id);
  const { busy, uri, phone, setPhone, run } = useDocument(estimate);
  const router = useRouter();
  const { showAlert } = useAlert();
  const remove = useCallback(() => {
    if (!estimate || busy) return;
    showAlert('Usunąć kosztorys z historii?', `${estimate.vehicle}${estimate.plate ? ` · ${estimate.plate}` : ''}. Tej zmiany nie można cofnąć.`, [
      { text: 'Zachowaj kosztorys', style: 'cancel' },
      { text: 'Usuń', style: 'destructive', onPress: async () => { try { await deleteEstimate(estimate.id); router.replace('/(tabs)'); } catch (reason) { showAlert('Nie zapisano zmiany', reason instanceof Error ? reason.message : 'Nie udało się usunąć kosztorysu.'); } } },
    ]);
  }, [estimate, busy, deleteEstimate, router, showAlert]);
  if (!loaded) return <Screen><ActivityIndicator color={colors.primary} /></Screen>;
  if (!estimate) return <Screen><Notice error>Nie znaleziono tego kosztorysu w historii urządzenia.</Notice><Button title="Wróć do kosztorysów" onPress={() => router.replace('/(tabs)')} /></Screen>;
  return <Screen keyboard>
    {fresh === '1' ? <View accessibilityLiveRegion="polite" style={styles.success}><Feather name="check-circle" size={22} color={colors.primary} /><View style={styles.successText}><Text style={styles.successTitle}>Kosztorys zapisany w historii</Text><Text style={styles.small}>Nie został jeszcze wysłany klientowi.</Text></View></View> : null}
    {storageError ? <Notice error>{storageError}</Notice> : null}
    <View style={styles.overview}><Text style={styles.kicker}>{estimate.number}</Text><Text style={styles.title}>{estimate.vehicle}</Text><View style={styles.metadata}>{estimate.plate ? <View style={styles.plate}><Text style={styles.plateText}>{estimate.plate}</Text></View> : null}<Text style={styles.small}>{new Date(estimate.createdAt).toLocaleDateString('pl-PL')} · {estimate.items.length} pozycji</Text></View><View style={styles.totalRow}><Text style={styles.totalLabel}>Razem brutto</Text><Text style={styles.amount}>{money(total(estimate.items))}</Text></View></View>
    <View style={styles.sendPanel}>
      <View style={styles.sendHeading}><Feather name="send" size={22} color={colors.primary} /><Text style={styles.sectionTitle}>Przekaż klientowi</Text></View>
      <Button title={Platform.OS === 'web' ? 'Drukuj / zapisz PDF' : 'Udostępnij kosztorys PDF'} icon={Platform.OS === 'web' ? 'file-text' : 'share'} loading={busy === 'pdf' || busy === 'share'} disabled={Boolean(busy)} onPress={() => run(Platform.OS === 'web' ? 'pdf' : 'share')} />
      <Text style={styles.description}>{Platform.OS === 'web' ? 'W oknie drukowania wybierz „Zapisz jako PDF”. Plik możesz później dołączyć do wiadomości.' : 'Aplikacja przygotuje PDF. W oknie udostępniania wybierz WhatsApp, e-mail lub inną aplikację, a następnie odbiorcę.'}</Text>
      {uri ? <View style={styles.ready}><Feather name="check-circle" size={16} color={colors.primary} /><Text style={styles.readyText}>PDF jest przygotowany. Możesz udostępnić go ponownie.</Text></View> : null}
      <Disclosure title="Wiadomość WhatsApp (opcjonalnie)" icon="message-circle">
        <Text style={styles.description}>Otwórz gotową wiadomość z pojazdem i łączną kwotą. Wysłanie zatwierdzisz samodzielnie w WhatsApp.</Text>
        <Field label="Numer klienta z kodem kraju" value={phone} onChangeText={setPhone} editable={!busy} keyboardType="phone-pad" placeholder="48 500 600 700" hint="Np. 48 dla Polski. Ten numer nie jest wymagany do udostępnienia PDF." />
        <Button title="Otwórz wiadomość WhatsApp" secondary icon="message-circle" loading={busy === 'whatsapp'} disabled={Boolean(busy)} onPress={() => run('whatsapp')} />
        <Notice>Wiadomość nie zawiera załącznika. Aby wysłać dokument, użyj przycisku „Udostępnij kosztorys PDF” i wybierz rozmowę z klientem.{Platform.OS === 'web' ? ' W przeglądarce dołącz zapisany PDF ręcznie.' : ''}</Notice>
      </Disclosure>
    </View>
    <View style={styles.previewHeading}><Feather name="file-text" size={20} color={colors.primary} /><Text style={styles.sectionTitle}>Podgląd dokumentu</Text></View>
    <DocumentPreview estimate={estimate} />
    <Disclosure title="Pozostałe opcje" icon="more-horizontal">
      {Platform.OS !== 'web' ? <Button title={uri ? 'PDF już przygotowany' : 'Przygotuj PDF bez wysyłania'} secondary icon="file-text" loading={busy === 'pdf'} disabled={Boolean(busy) || Boolean(uri)} onPress={() => run('pdf')} /> : null}
      <Button title="Usuń kosztorys z historii" secondary danger icon="trash-2" disabled={Boolean(busy)} onPress={remove} />
    </Disclosure>
    <Button title="Wróć do wszystkich kosztorysów" secondary icon="arrow-left" onPress={() => router.replace('/(tabs)')} />
  </Screen>;
}
export { EstimateDetailPage as default };
const styles = StyleSheet.create({
  success: { backgroundColor: colors.primaryDark, borderRadius: radius.sm, flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.md }, successText: { flex: 1, gap: spacing.xs }, successTitle: { color: colors.primary, fontSize: typography.body, fontWeight: '600' }, small: { color: colors.subtle, fontSize: typography.small, lineHeight: 20 },
  overview: { padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.primaryDark, gap: spacing.md }, kicker: { color: colors.primary, fontSize: typography.small, fontWeight: '600', letterSpacing: 1 }, title: { color: colors.text, fontSize: typography.title, fontWeight: '700', lineHeight: 35, includeFontPadding: false }, metadata: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.sm }, plate: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm }, plateText: { color: colors.text, fontSize: typography.body, fontWeight: '600', letterSpacing: 1 },
  totalRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border }, totalLabel: { color: colors.subtle, fontSize: typography.body }, amount: { color: colors.primary, fontSize: typography.title, fontWeight: '700' },
  description: { color: colors.subtle, fontSize: typography.body, lineHeight: 26 }, sendPanel: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, gap: spacing.md }, sendHeading: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm }, sectionTitle: { color: colors.text, fontSize: typography.section, fontWeight: '600', flexShrink: 1 }, ready: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' }, readyText: { color: colors.primary, fontSize: typography.label, lineHeight: 22, flex: 1 }, previewHeading: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
});
