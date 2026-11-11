import { useCallback } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Screen } from '@/components/layout/Screen';
import { Button, Chip, Field, IconButton, Notice } from '@/components/ui/Controls';
import { EstimateCard } from '@/components/feature/EstimateCard';
import { useDashboard } from '@/hooks/useDashboard';
import { useViewport } from '@/hooks/useViewport';
import { money } from '@/services/estimates';
import { colors, radius, spacing, typography } from '@/constants/theme';

export function DashboardPage() {
  const router = useRouter();
  const { estimates, settings, loaded, writable, storageError, summary, query, setQuery, filter, changeFilter, clearFilters, totalCount } = useDashboard();
  const { wide } = useViewport();
  const columns = wide ? 2 : 1;
  const start = useCallback(() => router.push('/new'), [router]);
  const openSettings = useCallback(() => router.push('/(tabs)/settings'), [router]);
  const hasFilters = Boolean(query.trim()) || filter !== 'all';
  const header = <View style={styles.header}>
    <View style={styles.brandRow}><View style={styles.brandIcon}><Feather name="tool" size={24} color={colors.primary} /></View><View style={styles.brandText}><Text style={styles.brand}>Kosztorys Mechanika</Text><Text style={styles.brandCaption}>Prosta wycena. Czytelny dokument.</Text></View>{settings.logo ? <Image source={{ uri: settings.logo }} style={styles.logo} contentFit="contain" transition={200} /> : null}</View>
    <View style={styles.hero}>
      <Text style={styles.kicker}>OD NAPRAWY DO DOKUMENTU</Text>
      <Text style={styles.title}>Co dziś wyceniasz?</Text>
      <Text style={styles.description}>Wybierz pojazd, opisz pracę i sprawdź ceny. Przygotuj PDF dla klienta.</Text>
      <Button title="Utwórz nowy kosztorys" icon="plus" onPress={start} disabled={!loaded || !writable} />
      <View style={styles.workflow}><Text style={styles.workflowText}>Pojazd</Text><Feather name="chevron-right" size={14} color={colors.primary} /><Text style={styles.workflowText}>Opis</Text><Feather name="chevron-right" size={14} color={colors.primary} /><Text style={styles.workflowText}>Ceny</Text><Feather name="chevron-right" size={14} color={colors.primary} /><Text style={styles.workflowText}>PDF</Text></View>
    </View>
    {storageError ? <Notice error>{storageError}</Notice> : null}
    <Pressable onPress={openSettings} accessibilityRole="button" accessibilityLabel="Otwórz dane i stawki warsztatu" style={({ pressed }) => [styles.workshop, pressed ? styles.pressed : null]}>
      <Feather name="sliders" size={20} color={colors.primary} /><View style={styles.workshopText}><Text style={styles.workshopName}>{settings.name}</Text><Text style={styles.small}>{settings.name === 'Twój warsztat' ? 'Ustaw nazwę i stawki do PDF' : `${money(settings.hourlyRate)}/h · narzut ${settings.markup}%`}</Text></View><Feather name="chevron-right" size={20} color={colors.subtle} />
    </Pressable>
    {loaded && totalCount > 0 ? <View style={styles.overview}><View style={styles.stat}><Text style={styles.small}>TEN MIESIĄC</Text><Text style={styles.statValue}>{summary.count} <Text style={styles.statUnit}>kosztorysów</Text></Text></View><View style={styles.statAmount}><Text style={styles.small}>WARTOŚĆ BRUTTO</Text><Text style={styles.amount}>{money(summary.amount)}</Text></View></View> : null}
    <View style={styles.section}><Text style={styles.sectionTitle}>Twoje kosztorysy</Text><View style={styles.count}><Text style={styles.countText}>{hasFilters ? `${estimates.length} z ${totalCount}` : totalCount}</Text></View></View>
    {totalCount > 0 ? <>
      <View style={styles.searchRow}><View style={styles.searchInput}><Field label="Szukaj kosztorysu" value={query} onChangeText={setQuery} autoCapitalize="none" autoCorrect={false} returnKeyType="search" placeholder="Marka, rejestracja lub numer" /></View>{query ? <IconButton icon="x" label="Wyczyść wyszukiwanie" onPress={() => setQuery('')} /> : null}</View>
      <View style={styles.filters}><Chip title="Wszystkie" selected={filter === 'all'} onPress={() => changeFilter('all')} /><Chip title="Ten miesiąc" selected={filter === 'month'} onPress={() => changeFilter('month')} /></View>
      {hasFilters ? <Text accessibilityLiveRegion="polite" style={styles.small}>{filter === 'month' ? 'Ten miesiąc' : 'Wszystkie'} · znaleziono: {estimates.length}{query.trim() ? ` · „${query.trim()}”` : ''}</Text> : null}
    </> : null}
  </View>;
  return <Screen tab scroll={false} keyboard><FlatList
    key={`estimates-${columns}`} numColumns={columns} columnWrapperStyle={columns > 1 ? styles.columns : undefined}
    data={estimates} keyExtractor={item => item.id}
    renderItem={({ item }) => <View style={styles.cardCell}><EstimateCard estimate={item} onPress={() => router.push({ pathname: '/estimate/[id]', params: { id: item.id } })} /></View>}
    ListHeaderComponent={header}
    ListEmptyComponent={!loaded ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : <View style={styles.empty}>
      <View style={styles.emptyIcon}><Feather name={hasFilters ? 'search' : 'clipboard'} size={28} color={colors.primary} /></View>
      <Text style={styles.emptyTitle}>{hasFilters ? 'Nie znaleziono kosztorysu' : 'Tutaj pojawi się Twoja pierwsza wycena'}</Text>
      <Text style={styles.emptyText}>{hasFilters ? 'Sprawdź markę lub rejestrację. Możesz też wyczyścić filtry.' : 'Naciśnij „Utwórz nowy kosztorys” powyżej. Zapisany dokument będzie można ponownie otworzyć i udostępnić.'}</Text>
      {hasFilters ? <Button title="Pokaż wszystkie kosztorysy" secondary compact icon="x" onPress={clearFilters} /> : null}
    </View>}
    ListFooterComponent={<View style={styles.footer}><Feather name="hard-drive" size={16} color={colors.subtle} /><Text style={styles.footerText}>Historia zapisuje się tylko na tym urządzeniu. Nie usuwaj danych aplikacji.</Text></View>}
    contentContainerStyle={styles.list} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag"
  /></Screen>;
}
export { DashboardPage as default };
const styles = StyleSheet.create({
  list: { padding: spacing.md, paddingBottom: spacing.lg }, header: { gap: spacing.md, marginBottom: spacing.md },
  columns: { gap: spacing.md }, cardCell: { flex: 1 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md }, brandIcon: { width: 48, height: 48, backgroundColor: colors.primaryDark, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  brandText: { flex: 1, gap: spacing.xs }, brand: { color: colors.text, fontSize: typography.section, fontWeight: '700', includeFontPadding: false }, brandCaption: { color: colors.subtle, fontSize: typography.small }, logo: { width: 44, height: 44, borderRadius: radius.sm },
  hero: { backgroundColor: colors.primaryDark, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md }, kicker: { color: colors.primary, fontSize: typography.small, fontWeight: '600', letterSpacing: 1, includeFontPadding: false },
  title: { color: colors.text, fontSize: typography.title, fontWeight: '700', lineHeight: 35, letterSpacing: -0.5, includeFontPadding: false }, description: { color: colors.subtle, fontSize: typography.body, lineHeight: 26 },
  workflow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: spacing.sm }, workflowText: { color: colors.primary, fontSize: typography.small, fontWeight: '600' },
  workshop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, padding: spacing.md, minHeight: 72 }, workshopText: { flex: 1, gap: spacing.xs }, workshopName: { color: colors.text, fontSize: typography.body, fontWeight: '600' }, pressed: { opacity: 0.7 },
  small: { color: colors.subtle, fontSize: typography.small, lineHeight: 20 }, overview: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface },
  stat: { flexGrow: 1, gap: spacing.sm }, statValue: { color: colors.text, fontSize: typography.section, fontWeight: '700' }, statUnit: { fontSize: typography.label, fontWeight: '400', color: colors.subtle }, statAmount: { gap: spacing.sm }, amount: { color: colors.primary, fontSize: typography.section, fontWeight: '700' },
  section: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, alignItems: 'center', marginTop: spacing.sm }, sectionTitle: { color: colors.text, fontSize: typography.section, fontWeight: '600' }, count: { backgroundColor: colors.raised, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.sm }, countText: { color: colors.subtle, fontSize: typography.small },
  searchRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-end' }, searchInput: { flex: 1 }, filters: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  empty: { alignItems: 'center', padding: spacing.lg, backgroundColor: colors.surface, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.border, borderRadius: radius.md, gap: spacing.md }, emptyIcon: { width: 60, height: 60, backgroundColor: colors.primaryDark, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' }, emptyTitle: { color: colors.text, fontSize: typography.section, fontWeight: '600', textAlign: 'center' }, emptyText: { color: colors.subtle, fontSize: typography.body, textAlign: 'center', lineHeight: 26 },
  footer: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, paddingVertical: spacing.lg }, footerText: { flex: 1, color: colors.subtle, fontSize: typography.small, lineHeight: 20 }, loader: { padding: spacing.xl },
});
