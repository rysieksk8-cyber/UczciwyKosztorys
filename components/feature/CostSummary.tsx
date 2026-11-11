import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { EstimateItem, money } from '@/services/estimates';
import { useEstimateSummary } from '@/hooks/useEstimateSummary';
import { colors, radius, spacing, typography } from '@/constants/theme';

interface CostSummaryProps { items: EstimateItem[]; title?: string }
export const CostSummary = memo(function CostSummary({ items, title = 'Podsumowanie wyceny' }: CostSummaryProps) {
  const summary = useEstimateSummary(items);
  return <View style={styles.card}>
    <View style={styles.heading}><Feather name="clipboard" size={20} color={colors.primary} /><Text style={styles.title}>{title}</Text></View>
    <View style={styles.row}><Text style={styles.label}>Robocizna</Text><Text style={styles.value}>{money(summary.categories.labor)}</Text></View>
    <View style={styles.row}><Text style={styles.label}>Części</Text><Text style={styles.value}>{money(summary.categories.parts)}</Text></View>
    <View style={styles.row}><Text style={styles.label}>Materiały</Text><Text style={styles.value}>{money(summary.categories.materials)}</Text></View>
    <View style={styles.total}><View style={styles.totalLabel}><Text style={styles.title}>Razem brutto</Text><Text style={styles.small}>{items.length} pozycji · ceny dla klienta</Text></View><Text style={styles.amount}>{money(summary.amount)}</Text></View>
    {summary.missingCount ? <View style={styles.warning}><Feather name="alert-circle" size={16} color={colors.danger} /><Text style={styles.warningText}>Pozycje do uzupełnienia: {summary.missingCount}. Kwota może jeszcze się zmienić.</Text></View> : null}
  </View>;
});
const styles = StyleSheet.create({
  card: { backgroundColor: colors.primaryDark, borderRadius: radius.md, padding: spacing.md, gap: spacing.md },
  heading: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { color: colors.text, fontSize: typography.body, fontWeight: '700', includeFontPadding: false },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md, flexWrap: 'wrap' },
  label: { color: colors.subtle, fontSize: typography.body },
  value: { color: colors.text, fontSize: typography.body, fontWeight: '500' },
  total: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md, flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, alignItems: 'center', justifyContent: 'space-between' },
  totalLabel: { gap: spacing.xs }, small: { color: colors.subtle, fontSize: typography.small },
  amount: { color: colors.primary, fontSize: typography.title, fontWeight: '700', includeFontPadding: false },
  warning: { flexDirection: 'row', gap: spacing.sm }, warningText: { color: colors.danger, fontSize: typography.label, lineHeight: 22, flex: 1 },
});
