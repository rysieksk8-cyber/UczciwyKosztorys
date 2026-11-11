import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Estimate, money, total, vehicleLabels } from '@/services/estimates';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { paperStyles } from '@/constants/styles';

interface EstimateCardProps { estimate: Estimate; onPress: () => void }
export const EstimateCard = memo(function EstimateCard({ estimate, onPress }: EstimateCardProps) {
  return <Pressable
    accessibilityRole="button"
    accessibilityLabel={`Kosztorys: ${estimate.vehicle}, ${estimate.plate || 'bez rejestracji'}, ${money(total(estimate.items))}`}
    accessibilityHint="Otwiera podgląd, PDF i opcje wysłania klientowi"
    onPress={onPress}
    style={({ pressed }) => [paperStyles.card, styles.card, pressed ? styles.pressed : null]}
  >
    <View style={styles.top}>
      <View style={styles.documentNumber}><Feather name="file-text" size={16} color={colors.subtle} /><Text numberOfLines={1} style={styles.number}>{estimate.number}</Text></View>
      <View style={styles.openIcon}><Feather name="arrow-up-right" size={18} color={colors.primary} /></View>
    </View>
    <Text numberOfLines={2} style={styles.vehicle}>{estimate.vehicle}</Text>
    <View style={styles.meta}>
      <View style={styles.plate}><Text style={styles.plateText}>{estimate.plate || 'BEZ REJESTRACJI'}</Text></View>
      <Text style={styles.small}>{vehicleLabels[estimate.vehicleType]} · {estimate.items.length} poz.</Text>
    </View>
    <View style={styles.bottom}>
      <View style={styles.date}><Text style={styles.small}>{new Date(estimate.createdAt).toLocaleDateString('pl-PL', { day: '2-digit', month: 'short', year: 'numeric' })}</Text><Text style={styles.caption}>Kwota brutto</Text></View>
      <Text style={styles.amount}>{money(total(estimate.items))}</Text>
    </View>
  </Pressable>;
});
const styles = StyleSheet.create({
  card: { padding: spacing.md, gap: spacing.md, marginBottom: spacing.md },
  pressed: { opacity: 0.75, transform: [{ scale: 0.99 }] },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  documentNumber: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  number: { flexShrink: 1, color: colors.subtle, fontSize: typography.small, fontWeight: '500' },
  openIcon: { width: spacing.xl, height: spacing.xl, backgroundColor: colors.primaryDark, borderRadius: radius.xs, alignItems: 'center', justifyContent: 'center' },
  vehicle: { color: colors.text, fontSize: typography.section, lineHeight: 26, fontWeight: '700', includeFontPadding: false },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, alignItems: 'center' },
  plate: { backgroundColor: colors.raised, borderRadius: radius.xs, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderWidth: 1, borderColor: colors.border },
  plateText: { color: colors.text, fontSize: typography.small, lineHeight: 20, fontWeight: '600', letterSpacing: 0.5 },
  small: { color: colors.subtle, fontSize: typography.small, lineHeight: 20 },
  caption: { color: colors.primary, fontSize: typography.small, lineHeight: 20, fontWeight: '500' },
  date: { gap: spacing.xs },
  amount: { color: colors.primary, fontSize: typography.title, lineHeight: 32, fontWeight: '700', includeFontPadding: false, flexShrink: 1 },
  bottom: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: colors.borderSoft, paddingTop: spacing.md },
});
