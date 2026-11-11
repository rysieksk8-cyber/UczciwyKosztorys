import { useCallback } from 'react';
import { BackHandler } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAlert } from '@/template';

interface ExitOptions { dirty: boolean; saving: boolean }
export function useEstimateExit({ dirty, saving }: ExitOptions) {
  const router = useRouter();
  const { showAlert } = useAlert();
  const exit = useCallback(() => { if (router.canGoBack()) router.back(); else router.replace('/(tabs)'); }, [router]);
  const requestExit = useCallback(() => {
    if (saving) return;
    if (!dirty) { exit(); return; }
    showAlert('Zamknąć tworzenie kosztorysu?', 'Niezapisany opis i pozycje zostaną utracone. Zapisana historia pozostanie bez zmian.', [
      { text: 'Zostań i dokończ', style: 'cancel' },
      { text: 'Odrzuć i zamknij', style: 'destructive', onPress: exit },
    ]);
  }, [dirty, saving, exit, showAlert]);
  useFocusEffect(useCallback(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => { requestExit(); return true; });
    return () => subscription.remove();
  }, [requestExit]));
  return { requestExit };
}
