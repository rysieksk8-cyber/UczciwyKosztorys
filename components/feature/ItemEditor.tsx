import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { categoryLabels, EstimateItem, ItemCategory, lineTotal, money } from '@/services/estimates';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { Chip, Field, IconButton } from '@/components/ui/Controls';
import { DecimalField } from '@/components/ui/DecimalField';
import { useItemStatus } from '@/hooks/useItemStatus';
interface ItemEditorProps { item: EstimateItem; index: number; onUpdate: (id: string, patch: Partial<EstimateItem>) => void; onRemove: (id: string) => void }
export const ItemEditor = memo(function ItemEditor({ item, index, onUpdate, onRemove }: ItemEditorProps) {
  const status = useItemStatus(item);
  return <View style={[styles.card, status.needsAttention ? styles.attention : null]}>
    <View style={styles.header}><View style={styles.identity}><Text style={styles.title}>Pozycja {String(index + 1).padStart(2, '0')}</Text><Text style={[styles.status, status.needsAttention ? styles.statusWarning : null]}>{status.needsAttention ? 'Do uzupełnienia' : categoryLabels[item.category]}</Text></View><IconButton icon="trash-2" label={`Usuń pozycję ${index + 1}`} onPress={() => onRemove(item.id)} danger /></View>
    <View style={styles.categories}>{(['labor', 'parts', 'materials'] as ItemCategory[]).map(category => <Chip key={category} title={categoryLabels[category]} selected={item.category === category} onPress={() => onUpdate(item.id, { category })} />)}</View>
    <Field label="Nazwa pozycji" error={status.nameError} placeholder="np. Wymiana klocków hamulcowych" value={item.name} onChangeText={name => onUpdate(item.id, { name })} />
    <View style={styles.row}>
      <DecimalField label={item.category === 'labor' ? 'Czas (h)' : 'Ilość (szt.)'} value={item.quantity} error={status.quantityError} hint={item.category === 'labor' ? 'Np. 1,5 = półtorej godziny' : undefined} onChange={quantity => onUpdate(item.id, { quantity })} />
      {item.category === 'labor' ? <DecimalField key="rate" label="Stawka brutto (zł/h)" value={item.unitPrice} error={status.priceError} onChange={unitPrice => onUpdate(item.id, { unitPrice })} /> : <DecimalField key="purchase" label="Zakup brutto (zł/szt.)" value={item.purchasePrice} onChange={purchasePrice => onUpdate(item.id, { purchasePrice })} />}
    </View>
    {item.category !== 'labor' ? <>
      <View style={styles.row}><DecimalField label="Narzut na zakup (%)" value={item.markup} error={status.markupError} onChange={markup => onUpdate(item.id, { markup })} /><DecimalField label="Cena dla klienta (zł/szt.)" value={item.unitPrice} error={status.priceError} onChange={unitPrice => onUpdate(item.id, { unitPrice })} /></View>
      <Text style={styles.hint}>Możesz poprawić cenę sprzedaży ręcznie. Zmiana zakupu lub narzutu przeliczy ją ponownie.</Text>
    </> : null}
    <View style={styles.total}><Text style={styles.label}>Razem brutto</Text><Text style={styles.price}>{money(lineTotal(item))}</Text></View>
  </View>;
});
const styles = StyleSheet.create({ card: { marginBottom: spacing.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, gap: spacing.md }, attention: { borderColor: colors.danger }, identity: { flex: 1, gap: spacing.xs }, status: { fontSize: typography.small, color: colors.primary }, statusWarning: { color: colors.danger }, header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, title: { color: colors.text, fontSize: typography.body, fontWeight: '700' }, categories: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }, row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }, label: { color: colors.subtle, fontSize: typography.label }, hint: { color: colors.subtle, fontSize: typography.label, lineHeight: 23 }, price: { color: colors.primary, fontSize: typography.section, fontWeight: '700' }, total: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md } });
