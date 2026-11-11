import { memo, ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useDisclosure } from '@/hooks/useDisclosure';
import { colors, radius, spacing, typography } from '@/constants/theme';

interface DisclosureProps { title: string; children: ReactNode; icon?: keyof typeof Feather.glyphMap; initialOpen?: boolean }
export const Disclosure = memo(function Disclosure({ title, children, icon = 'help-circle', initialOpen = false }: DisclosureProps) {
  const { open, toggle } = useDisclosure(initialOpen);
  return <View style={styles.container}>
    <Pressable onPress={toggle} accessibilityRole="button" accessibilityLabel={title} accessibilityState={{ expanded: open }} style={({ pressed }) => [styles.trigger, pressed ? styles.pressed : null]}>
      <Feather name={icon} size={20} color={colors.primary} />
      <Text style={styles.title}>{title}</Text>
      <Feather name={open ? 'chevron-up' : 'chevron-down'} size={20} color={colors.subtle} />
    </Pressable>
    {open ? <View style={styles.content}>{children}</View> : null}
  </View>;
});
const styles = StyleSheet.create({
  container: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.sm, overflow: 'hidden' },
  trigger: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md },
  title: { flex: 1, color: colors.text, fontSize: typography.body, fontWeight: '600', includeFontPadding: false },
  pressed: { opacity: 0.7, backgroundColor: colors.raised },
  content: { padding: spacing.md, paddingTop: 0, gap: spacing.md },
});
