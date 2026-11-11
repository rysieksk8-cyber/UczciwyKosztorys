import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { vehicleLabels, VehicleType } from '@/services/estimates';
import { colors, radius, spacing, typography } from '@/constants/theme';
interface VehiclePickerProps { value: VehicleType; onChange: (value: VehicleType) => void }
const icons = { car: 'car-outline', motorcycle: 'motorbike', truck: 'truck-outline' } as const;
export const VehiclePicker = memo(function VehiclePicker({ value, onChange }: VehiclePickerProps) {
  return <View style={styles.root}><Text style={styles.label}>Rodzaj pojazdu</Text><View style={styles.options}>{(['car', 'motorcycle', 'truck'] as VehicleType[]).map(type => {
    const selected = type === value;
    return <Pressable key={type} onPress={() => onChange(type)} accessibilityLabel={vehicleLabels[type]} accessibilityRole="radio" accessibilityState={{ selected }} style={({ pressed }) => [styles.card, selected ? styles.selected : null, pressed ? styles.pressed : null]}>
      <MaterialCommunityIcons name={icons[type]} size={32} color={selected ? colors.primary : colors.subtle} />
      <Text style={[styles.title, selected ? styles.selectedTitle : null]}>{vehicleLabels[type]}</Text>
      <MaterialCommunityIcons name={selected ? 'check-circle-outline' : 'circle-outline'} size={18} color={selected ? colors.primary : colors.subtle} />
    </Pressable>;
  })}</View></View>;
});
const styles = StyleSheet.create({
  root: { gap: spacing.sm }, label: { color: colors.subtle, fontSize: typography.label, fontWeight: '500' },
  options: { flexDirection: 'row', gap: spacing.sm },
  card: { minHeight: 112, flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.sm, padding: spacing.sm, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.sm },
  selected: { borderColor: colors.primary, backgroundColor: colors.primaryDark }, pressed: { opacity: 0.7, transform: [{ scale: 0.98 }] },
  title: { fontSize: typography.label, fontWeight: '600', color: colors.subtle, textAlign: 'center', includeFontPadding: false }, selectedTitle: { color: colors.primary },
});
