import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing, typography } from '@/constants/theme';
export function TabLayout() { const insets = useSafeAreaInsets(); return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.primary, tabBarInactiveTintColor: colors.subtle, tabBarActiveBackgroundColor: colors.primaryDark, tabBarItemStyle: { borderRadius: radius.sm, marginHorizontal: spacing.xs }, tabBarStyle: { height: Platform.select({ ios: insets.bottom + 60, android: insets.bottom + 60, default: 70 }), paddingTop: 8, paddingBottom: Platform.select({ ios: insets.bottom + 8, android: insets.bottom + 8, default: 8 }), paddingHorizontal: 16, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.borderSoft }, tabBarLabelStyle: { fontSize: typography.small, fontWeight: '600', includeFontPadding: false } }}><Tabs.Screen name="index" options={{ title: 'Kosztorysy', tabBarIcon: ({ color, size }) => <Feather name="file-text" size={size} color={color} /> }} /><Tabs.Screen name="settings" options={{ title: 'Warsztat', tabBarIcon: ({ color, size }) => <Feather name="tool" size={size} color={color} /> }} /></Tabs>; }
export { TabLayout as default };
