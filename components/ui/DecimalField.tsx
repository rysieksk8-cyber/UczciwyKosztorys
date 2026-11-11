import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { spacing } from '@/constants/theme';
import { useDecimalField } from '@/hooks/useDecimalField';
import { Field } from './Controls';
interface DecimalFieldProps { label: string; value: number; onChange: (value: number) => void; hint?: string }
export const DecimalField = memo(function DecimalField({ label, value, onChange, hint }: DecimalFieldProps) {
  const input = useDecimalField(value, onChange);
  return <View style={styles.cell}><Field label={label} hint={hint} keyboardType="decimal-pad" {...input} /></View>;
});
const styles = StyleSheet.create({ cell: { flex: 1, minWidth: spacing.xxl * 2 + spacing.md } });
