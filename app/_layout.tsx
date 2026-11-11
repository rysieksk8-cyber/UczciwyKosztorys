import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AlertProvider } from '@/template';
import { WorkshopProvider } from '@/contexts/WorkshopContext';
import { colors } from '@/constants/theme';
export function RootLayout() { return <AlertProvider><SafeAreaProvider><WorkshopProvider><StatusBar style="dark" /><Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background }, headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.text, headerShadowVisible: false, headerBackTitle: 'Wstecz' }}><Stack.Screen name="index" /><Stack.Screen name="(tabs)" /><Stack.Screen name="new" options={{ headerShown: true, title: 'Nowy kosztorys' }} /><Stack.Screen name="appointment" options={{ headerShown: true, title: 'Wizyta w kalendarzu' }} /><Stack.Screen name="estimate/[id]" options={{ headerShown: true, title: 'Szczegóły kosztorysu' }} /></Stack></WorkshopProvider></SafeAreaProvider></AlertProvider>; }
export { RootLayout as default };
