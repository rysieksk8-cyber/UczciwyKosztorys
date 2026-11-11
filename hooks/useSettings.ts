import { useCallback, useEffect, useRef, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { useAlert } from '@/template';
import { decimalNumber, WorkshopSettings } from '@/services/estimates';
import { useWorkshop } from './useWorkshop';
export function useSettings() {
  const { settings, updateSettings, loaded, writable, storageError } = useWorkshop();
  const { showAlert } = useAlert();
  const [draft, setDraft] = useState(settings);
  const [rate, setRate] = useState(String(settings.hourlyRate));
  const [markup, setMarkup] = useState(String(settings.markup));
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const working = useRef(false);
  useEffect(() => { setDraft(settings); setRate(String(settings.hourlyRate)); setMarkup(String(settings.markup)); }, [settings]);
  const change = useCallback((patch: Partial<WorkshopSettings>) => { setDraft(previous => ({ ...previous, ...patch })); setSaved(false); }, []);
  const changeRate = useCallback((value: string) => { setRate(value); setSaved(false); }, []);
  const changeMarkup = useCallback((value: string) => { setMarkup(value); setSaved(false); }, []);
  const pickLogo = useCallback(async () => {
    if (!loaded || !writable || working.current) return;
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8, base64: true });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        change({ logo: asset.base64 ? `data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}` : asset.uri });
      }
    } catch { showAlert('Logo', 'Nie można otworzyć galerii zdjęć. Sprawdź uprawnienia aplikacji.'); }
  }, [loaded, writable, change, showAlert]);
  const save = useCallback(async () => {
    if (working.current || !loaded || !writable) return;
    const hourlyRate = decimalNumber(rate);
    const margin = decimalNumber(markup);
    if (!draft.name.trim() || hourlyRate === null || hourlyRate <= 0 || margin === null || margin > 1000) { setError('Podaj nazwę warsztatu, dodatnią stawkę i narzut od 0 do 1000%.'); return; }
    working.current = true;
    setSaving(true);
    setSaved(false);
    setError('');
    try {
      await updateSettings({ ...draft, name: draft.name.trim(), hourlyRate, markup: margin });
      setSaved(true);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Nie udało się zapisać ustawień. Spróbuj ponownie.'); }
    finally { working.current = false; setSaving(false); }
  }, [draft, rate, markup, loaded, writable, updateSettings]);
  const dirty = draft.name !== settings.name || draft.address !== settings.address || draft.phone !== settings.phone || draft.logo !== settings.logo || rate !== String(settings.hourlyRate) || markup !== String(settings.markup);
  const previewRate = decimalNumber(rate);
  const previewMarkup = decimalNumber(markup);
  const previewPartPrice = previewMarkup !== null && previewMarkup <= 1000 ? Math.round(100 * (1 + previewMarkup / 100) * 100) / 100 : null;
  return { draft, rate, markup, error: error || storageError, saved, saving, dirty, previewRate, previewPartPrice, loaded: loaded && writable, change, changeRate, changeMarkup, pickLogo, save };
}
