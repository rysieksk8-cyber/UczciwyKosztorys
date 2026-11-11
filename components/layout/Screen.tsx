import { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '@/constants/theme';
interface ScreenProps { children: ReactNode; tab?: boolean; scroll?: boolean; footer?: ReactNode; keyboard?: boolean }
export function Screen({ children, tab, scroll = true, footer, keyboard }: ScreenProps) {
  const insets = useSafeAreaInsets();
  // Some edge-to-edge preview hosts report a zero bottom inset even when
  // Android's navigation bar overlays the app. Keep actions above that area.
  // SafeAreaView already applies the reported inset: add only the shortfall.
  const minimumBottomSpace = Platform.OS === 'ios' ? spacing.md : spacing.xxl;
  const footerBottomPadding = spacing.md + (tab ? 0 : Math.max(0, minimumBottomSpace - insets.bottom));

  return (
    <SafeAreaView style={styles.safe} edges={tab ? ['top'] : ['bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior={keyboard ? (Platform.OS === 'ios' ? 'padding' : 'height') : undefined}>
        {scroll ? (
          <ScrollView style={styles.flex} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={styles.inner}>{children}</View>
          </ScrollView>
        ) : <View style={styles.listContent}>{children}</View>}
        {footer ? (
          <View style={[styles.footer, { paddingBottom: footerBottomPadding }]}>
            <View style={styles.footerInner}>{footer}</View>
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.background }, flex: { flex: 1 }, content: { padding: spacing.md, paddingBottom: spacing.xl, alignItems: 'center' }, inner: { width: '100%', maxWidth: 960, gap: spacing.lg }, listContent: { flex: 1, width: '100%', maxWidth: 1008, alignSelf: 'center' }, footer: { padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface }, footerInner: { width: '100%', maxWidth: 960, alignSelf: 'center', gap: spacing.sm } });
