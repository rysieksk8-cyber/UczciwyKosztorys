import { useCallback, useEffect, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { useAlert } from '@/template';
import { WorkshopSettings } from '@/services/estimates';
import { useWorkshop } from './useWorkshop';
export function useSettings() {
  const { settings, updateSettings, loaded } = useWorkshop();
  const { showAlert } = useAlert();
  const [draft, setDraft] = useState(settings);
  const [rate, setRate] = useState(String(settings.hourlyRate));
  const [markup, setMarkup] = useState(String(settings.markup));
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  useEffect(() => { setDraft(settings); setRate(String(settings.hourlyRate)); setMarkup(String(settings.markup)); }, [settings]);
  const change = useCallback((patch: Partial<WorkshopSettings>) => { setDraft(previous => ({ ...previous, ...patch })); setSaved(false); }, []);
  const changeRate = useCallback((value: string) => { setRate(value); setSaved(false); }, []);
  const changeMarkup = useCallback((value: string) => { setMarkup(value); setSaved(false); }, []);
  const pickLogo = useCallback(async () => { try { const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8, base64: true }); if (!result.canceled && result.assets[0]) { const asset = result.assets[0]; change({ logo: asset.base64 ? `data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}` : asset.uri }); } } catch { showAlert('Logo', 'Nie można otworzyć galerii zdjęć. Sprawdź uprawnienia aplikacji.'); } }, [change, showAlert]);
  const save = useCallback(() => { const hourlyRate = Number(rate.replace(',', '.')); const margin = Number(markup.replace(',', '.')); if (!draft.name.trim() || !rate.trim() || !markup.trim() || !Number.isFinite(hourlyRate) || hourlyRate <= 0 || !Number.isFinite(margin) || margin < 0 || margin > 1000) { setError('Podaj nazwę warsztatu, dodatnią stawkę i narzut od 0 do 1000%.'); return; } updateSettings({ ...draft, name: draft.name.trim(), hourlyRate, markup: margin }); setError(''); setSaved(true); }, [draft, rate, markup, updateSettings]);
  return { draft, rate, markup, error, saved, loaded, change, changeRate, changeMarkup, pickLogo, save };
}
