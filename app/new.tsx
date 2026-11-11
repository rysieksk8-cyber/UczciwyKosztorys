import { useCallback } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAlert } from '@/template';
import { Screen } from '@/components/layout/Screen';
import { Button, Field, Notice } from '@/components/ui/Controls';
import { VehiclePicker } from '@/components/feature/VehiclePicker';
import { VoicePanel } from '@/components/feature/VoicePanel';
import { ItemEditor } from '@/components/feature/ItemEditor';
import { CostSummary } from '@/components/feature/CostSummary';
import { useEstimateDraft } from '@/hooks/useEstimateDraft';
import { useEstimateExit } from '@/hooks/useEstimateExit';
import { money, total, vehicleLabels } from '@/services/estimates';
import { colors, layout, radius, spacing, typography } from '@/constants/theme';
import { paperStyles } from '@/constants/styles';

const stepNames = ['Pojazd', 'Opis', 'Ceny', 'Zapis'];
const titles = ['Dla którego pojazdu?', 'Co zostało zrobione?', 'Sprawdź pozycje i ceny', 'Sprawdź i zapisz kosztorys'];
const subtitles = ['Wpisz markę i model. Rejestracja jest opcjonalna.', 'Wpisz opis lub użyj mikrofonu klawiatury. Ceny uzupełnisz za chwilę.', 'Popraw nazwy, ilości i kwoty. Wszystkie ceny są brutto.', 'To ostatni krok. Po zapisaniu udostępnisz PDF klientowi.'];

export function NewEstimatePage() {
  const draft = useEstimateDraft();
  const router = useRouter();
  const { showAlert } = useAlert();
  const dirty = Boolean(draft.vehicle.trim() || draft.plate.trim() || draft.transcript.trim() || draft.items.length || draft.vehicleType !== 'car' || (draft.phone.trim() && draft.phone.trim() !== '48') || draft.recording || draft.recordBusy);
  const { requestExit } = useEstimateExit({ dirty, saving: draft.saving });
  const locked = draft.recording || draft.recordBusy || draft.saving;
  const continueDraft = useCallback(async () => {
    if (draft.step !== 4) { draft.next(); return; }
    const estimate = await draft.save();
    if (estimate) router.replace({ pathname: '/estimate/[id]', params: { id: estimate.id, fresh: '1' } });
  }, [draft.step, draft.next, draft.save, router]);
  const removeItem = useCallback((id: string) => showAlert('Usunąć pozycję?', 'Pozostałe pozycje i ceny pozostaną bez zmian.', [
    { text: 'Anuluj', style: 'cancel' }, { text: 'Usuń pozycję', style: 'destructive', onPress: () => draft.removeItem(id) },
  ]), [showAlert, draft.removeItem]);
  const navigation = <Stack.Screen options={{ gestureEnabled: false, headerLeft: () => <Pressable onPress={requestExit} disabled={draft.saving} accessibilityRole="button" accessibilityLabel="Zamknij tworzenie kosztorysu" accessibilityState={{ disabled: draft.saving }} style={({ pressed }) => [styles.close, pressed ? styles.pressed : null]}><Feather name="x" size={22} color={colors.text} /></Pressable> }} />;
  const heading = <View style={[paperStyles.hero, styles.heading]}>
    <View style={styles.steps}>{stepNames.map((name, index) => {
      const current = index + 1 === draft.step;
      const complete = index + 1 < draft.step;
      const disabled = locked || !complete;
      return <Pressable key={name} disabled={disabled} onPress={() => draft.goToStep(index + 1)} accessibilityRole="button" accessibilityLabel={`${index + 1}. ${name}${complete ? ', wróć do tego kroku' : ''}`} accessibilityState={{ selected: current, disabled }} style={({ pressed }) => [styles.step, current ? styles.currentStep : complete ? styles.completedStep : null, pressed ? styles.pressed : null]}>
        <View style={[styles.stepCircle, current ? styles.currentCircle : complete ? styles.completedCircle : null]}>{complete ? <Feather name="check" size={17} color={colors.primary} /> : <Text style={[styles.stepNumber, current ? styles.currentNumber : null]}>{index + 1}</Text>}</View>
        <Text style={[styles.stepLabel, current || complete ? styles.activeLabel : null]}>{name}</Text>
      </Pressable>;
    })}</View>
    <Text style={styles.kicker}>KROK {draft.step} Z 4</Text>
    <Text style={styles.title}>{titles[draft.step - 1]}</Text>
    <Text style={styles.description}>{subtitles[draft.step - 1]}</Text>
    {draft.step > 1 ? <View style={styles.vehicleTag}><Feather name="tag" size={16} color={colors.primary} /><Text numberOfLines={1} style={styles.vehicleTagText}>{draft.vehicle}{draft.plate.trim() ? ` · ${draft.plate.trim().toUpperCase()}` : ''}</Text></View> : null}
  </View>;
  const footer = <View style={styles.actions}>
    {draft.step >= 3 ? <View style={styles.footerTotal}><View style={styles.footerLabel}><Text style={styles.totalLabel}>Razem brutto</Text>{draft.missingCount ? <Text style={styles.missing}>Do uzupełnienia: {draft.missingCount} poz.</Text> : null}</View><Text style={styles.amount}>{money(total(draft.items))}</Text></View> : null}
    {draft.error ? <Notice error compact>{draft.error}</Notice> : null}
    <Button title={draft.step === 4 ? 'Zapisz kosztorys' : draft.step === 3 ? 'Przejdź do podsumowania' : draft.step === 2 ? 'Sprawdź pozycje i ceny' : 'Przejdź do opisu pracy'} icon={draft.step === 4 ? 'check' : 'arrow-right'} loading={draft.saving} disabled={locked} onPress={continueDraft} />
    {draft.step > 1 ? <Pressable accessibilityRole="button" accessibilityLabel="Wróć do poprzedniego kroku" accessibilityState={{ disabled: locked }} disabled={locked} onPress={draft.back} style={({ pressed }) => [styles.previousAction, locked ? styles.disabled : null, pressed ? styles.pressed : null]}><Feather name="chevron-left" size={18} color={colors.subtle} /><Text style={styles.previousText}>Poprzedni krok</Text></Pressable> : null}
  </View>;
  if (draft.step === 3) return <Screen scroll={false} keyboard footer={footer}>{navigation}<FlatList
    data={draft.items} keyExtractor={item => item.id}
    renderItem={({ item, index }) => <ItemEditor item={item} index={index} onUpdate={draft.updateItem} onRemove={removeItem} />}
    ListHeaderComponent={<View style={styles.listHeader}>{heading}<Notice>Pozycje powstały z opisu, nie z automatycznej wyceny. Sprawdź każdą cenę. Czerwone oznaczenia pokazują, co trzeba uzupełnić.</Notice></View>}
    ListFooterComponent={<View style={styles.addPanel}><Text style={styles.cardTitle}>Brakuje czegoś w wycenie?</Text><View style={styles.addActions}><Button title="Dodaj pracę" secondary compact icon="plus" onPress={() => draft.addItem('labor')} /><Button title="Dodaj część" secondary compact icon="plus" onPress={() => draft.addItem('parts')} /><Button title="Dodaj materiał" secondary compact icon="plus" onPress={() => draft.addItem('materials')} /></View></View>}
    ListEmptyComponent={<Text style={styles.description}>Dodaj pierwszą pozycję przyciskiem poniżej.</Text>}
    contentContainerStyle={styles.list} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag"
  /></Screen>;
  return <Screen key={`draft-step-${draft.step}`} keyboard footer={footer}>{navigation}{heading}
    {draft.step === 1 ? <>
      <VehiclePicker value={draft.vehicleType} onChange={draft.setVehicleType} />
      <View style={styles.card}><Field label="Marka i model pojazdu *" error={draft.fieldErrors.vehicle} value={draft.vehicle} onChangeText={draft.setVehicle} placeholder="np. Škoda Octavia 1.6 TDI" autoCapitalize="words" /><Field label="Numer rejestracyjny (opcjonalnie)" value={draft.plate} onChangeText={draft.setPlate} autoCapitalize="characters" autoCorrect={false} placeholder="np. WWA 12345" hint="Dzięki rejestracji szybciej znajdziesz tę wycenę w historii." /></View>
      <View style={styles.tip}><Feather name="sliders" size={20} color={colors.primary} /><View style={styles.tipText}><Text style={styles.tipTitle}>Twoje domyślne stawki</Text><Text style={styles.description}>{money(draft.settings.hourlyRate)}/h · narzut na zakup {draft.settings.markup}%</Text><Text style={styles.hint}>Każdą cenę możesz później zmienić w kosztorysie.</Text></View></View>
    </> : draft.step === 2 ? <VoicePanel transcript={draft.transcript} onChange={draft.setTranscript} recording={draft.recording} busy={draft.recordBusy} finishing={draft.finishing} seconds={draft.seconds} onRecord={draft.toggleRecording} error={draft.voiceError} recognized={draft.recognized} liveTranscript={draft.liveTranscript} available={draft.voiceAvailable} checking={draft.voiceChecking} unavailableReason={draft.voiceUnavailableReason} /> : <>
      <View style={styles.card}><View style={styles.reviewHeader}><Text style={styles.cardTitle}>Pojazd i warsztat</Text><Feather name="check-circle" size={20} color={colors.primary} /></View><Text style={styles.reviewVehicle}>{draft.vehicle}</Text><Text style={styles.description}>{vehicleLabels[draft.vehicleType]}{draft.plate.trim() ? ` · ${draft.plate.trim().toUpperCase()}` : ' · bez rejestracji'}</Text><Text style={styles.hint}>{draft.settings.name}</Text><Button title="Popraw dane pojazdu" secondary compact icon="edit-3" onPress={() => draft.goToStep(1)} /></View>
      <CostSummary items={draft.items} />
      <Button title="Popraw pozycje lub ceny" secondary compact icon="edit-3" onPress={() => draft.goToStep(3)} />
      <View style={styles.card}><Text style={styles.cardTitle}>Kontakt do klienta</Text><Field label="Telefon WhatsApp (opcjonalnie)" error={draft.fieldErrors.phone} value={draft.phone} onChangeText={draft.setPhone} keyboardType="phone-pad" placeholder="48 500 600 700" hint="Numer z kodem kraju, np. 48 dla Polski. Nie jest potrzebny do zapisania PDF." /></View>
      <Notice icon="check-circle">Zapiszesz kosztorys w historii na tym urządzeniu. Na następnym ekranie przygotujesz i udostępnisz PDF — nic nie zostanie wysłane automatycznie.</Notice>
    </>}
  </Screen>;
}
export { NewEstimatePage as default };
const styles = StyleSheet.create({
  close: { minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' }, pressed: { opacity: 0.7 },
  heading: { gap: spacing.md, padding: spacing.md }, steps: { flexDirection: 'row', gap: spacing.sm }, step: { flex: 1, minHeight: 72, alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm, borderBottomWidth: 2, borderBottomColor: colors.border }, currentStep: { borderBottomColor: colors.primary }, completedStep: { borderBottomColor: colors.primary },
  stepCircle: { width: 32, height: 32, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.raised, borderWidth: 1, borderColor: colors.border }, currentCircle: { backgroundColor: colors.primary, borderColor: colors.primary }, completedCircle: { backgroundColor: colors.primaryDark, borderColor: colors.primary }, stepNumber: { color: colors.subtle, fontSize: typography.label, fontWeight: '600' }, currentNumber: { color: colors.onPrimary }, stepLabel: { fontSize: typography.small, color: colors.subtle }, activeLabel: { color: colors.primary, fontWeight: '600' },
  kicker: { color: colors.primary, fontSize: typography.small, letterSpacing: 1, fontWeight: '600' }, title: { color: colors.text, fontSize: typography.title, fontWeight: '700', lineHeight: 32, letterSpacing: -0.5, includeFontPadding: false }, description: { color: colors.subtle, fontSize: typography.body, lineHeight: 26 },
  vehicleTag: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, alignSelf: 'flex-start', maxWidth: '100%', backgroundColor: colors.primaryDark, borderRadius: radius.sm, padding: spacing.sm }, vehicleTagText: { flexShrink: 1, color: colors.primary, fontSize: typography.label, fontWeight: '600' },
  tip: { padding: spacing.md, gap: spacing.md, flexDirection: 'row', backgroundColor: colors.primaryDark, borderRadius: radius.md }, tipText: { flex: 1, gap: spacing.sm }, tipTitle: { color: colors.primary, fontSize: typography.body, fontWeight: '600' }, hint: { color: colors.subtle, fontSize: typography.label, lineHeight: 23 },
  card: { padding: spacing.md, gap: spacing.md, backgroundColor: colors.surface, borderColor: colors.borderSoft, borderWidth: 1, borderRadius: radius.md }, cardTitle: { color: colors.text, fontSize: typography.body, fontWeight: '600' }, reviewHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm }, reviewVehicle: { color: colors.text, fontSize: typography.section, fontWeight: '700' },
  actions: { gap: spacing.sm }, previousAction: { minHeight: layout.touchHeight, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, borderRadius: radius.sm }, previousText: { color: colors.subtle, fontSize: typography.label, fontWeight: '500', lineHeight: 22 }, disabled: { opacity: 0.5 }, footerTotal: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm }, footerLabel: { gap: spacing.xs }, totalLabel: { color: colors.subtle, fontSize: typography.label }, missing: { color: colors.danger, fontSize: typography.small }, amount: { color: colors.primary, fontSize: typography.section, fontWeight: '700' },
  list: { padding: spacing.md, paddingBottom: spacing.lg }, listHeader: { gap: spacing.md, marginBottom: spacing.md }, addPanel: { gap: spacing.md, paddingVertical: spacing.md }, addActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
