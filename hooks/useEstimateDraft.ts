import { useCallback, useMemo, useRef, useState } from 'react';
import { useAlert } from '@/template';
import { Estimate, EstimateItem, ItemCategory, itemValidationError, newItem, parseDescription, sellingPrice, VehicleType } from '@/services/estimates';
import { itemNeedsAttention } from '@/services/estimateInsights';
import { useWorkshop } from './useWorkshop';
import { useVoiceRecognition } from './useVoiceRecognition';
export function useEstimateDraft() {
  const { settings, addEstimate, loaded, writable } = useWorkshop();
  const { showAlert } = useAlert();
  const [step, setStep] = useState(1);
  const [vehicleType, setVehicleType] = useState<VehicleType>('car');
  const [transcript, setTranscript] = useState('');
  const [items, setItems] = useState<EstimateItem[]>([]);
  const [vehicle, setVehicle] = useState('');
  const [plate, setPlate] = useState('');
  const [phone, setPhone] = useState('48');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({ vehicle: '', phone: '' });
  const savingRef = useRef(false);
  const savedEstimate = useRef<Estimate | null>(null);
  const parsedText = useRef<string | null>(null);
  const onRecognized = useCallback((text: string) => {
    setTranscript(previous => previous.trim() ? `${previous.trim()}\n${text}` : text);
    setError('');
  }, []);
  const voice = useVoiceRecognition({ onRecognized });
  const { recording, recordBusy } = voice;
  const updateItem = useCallback((id: string, patch: Partial<EstimateItem>) => setItems(previous => previous.map(item => {
    if (item.id !== id) return item;
    const updated = { ...item, ...patch };
    if (updated.category !== 'labor' && (patch.purchasePrice !== undefined || patch.markup !== undefined)) updated.unitPrice = sellingPrice(updated.purchasePrice, updated.markup);
    if (patch.category !== undefined && patch.category !== item.category) updated.unitPrice = patch.category === 'labor' ? settings.hourlyRate : sellingPrice(updated.purchasePrice, updated.markup);
    return updated;
  })), [settings.hourlyRate]);
  const addItem = useCallback((category: ItemCategory = 'labor') => setItems(previous => [...previous, newItem(settings, category)]), [settings]);
  const removeItem = useCallback((id: string) => setItems(previous => previous.filter(item => item.id !== id)), []);
  const next = useCallback(() => {
    if (savingRef.current) return;
    setError('');
    if (step === 1 && !vehicle.trim()) {
      setFieldErrors(previous => ({ ...previous, vehicle: 'Wpisz markę i model pojazdu.' }));
      setError('Uzupełnij pojazd, żeby łatwo odnaleźć kosztorys.');
      return;
    }
    if (step === 1) setFieldErrors(previous => ({ ...previous, vehicle: '' }));
    if (step === 2) {
      if (recording || recordBusy) { setError('Zatrzymaj dyktowanie i poczekaj na zakończenie rozpoznawania.'); return; }
      if (!transcript.trim()) { setError('Podyktuj opis pracy albo wpisz go ręcznie.'); return; }
      const regenerate = () => { setItems(parseDescription(transcript, settings)); parsedText.current = transcript; setStep(3); };
      if (parsedText.current === null) { regenerate(); return; }
      if (parsedText.current !== transcript) {
        showAlert('Opis został zmieniony', 'Ponowne wyodrębnienie zastąpi pozycje i ręcznie ustawione ceny. Możesz zachować obecne pozycje.', [
          { text: 'Anuluj', style: 'cancel' },
          { text: 'Zachowaj pozycje', onPress: () => { parsedText.current = transcript; setStep(3); } },
          { text: 'Wyodrębnij od nowa', style: 'destructive', onPress: regenerate },
        ]);
        return;
      }
    }
    if (step === 3) {
      const invalid = itemValidationError(items);
      if (invalid) { setError(invalid); return; }
    }
    setStep(value => Math.min(4, value + 1));
  }, [step, vehicle, transcript, settings, items, recording, recordBusy, showAlert]);
  const back = useCallback(() => { if (savingRef.current) return; setError(''); setStep(value => Math.max(1, value - 1)); }, []);
  const goToStep = useCallback((target: number) => {
    if (savingRef.current || recording || recordBusy || target < 1 || target >= step) return;
    setError('');
    setStep(target);
  }, [step, recording, recordBusy]);
  const missingCount = useMemo(() => items.filter(itemNeedsAttention).length, [items]);
  const changeVehicle = useCallback((value: string) => { setVehicle(value); setFieldErrors(previous => ({ ...previous, vehicle: '' })); setError(''); }, []);
  const changePhone = useCallback((value: string) => { setPhone(value); setFieldErrors(previous => ({ ...previous, phone: '' })); setError(''); }, []);
  const save = useCallback(async (): Promise<Estimate | null> => {
    if (savedEstimate.current) return savedEstimate.current;
    if (savingRef.current) return null;
    if (!loaded || !writable) { setError('Pamięć nie jest gotowa do zapisu. Nie usuwaj danych aplikacji; uruchom ją ponownie.'); return null; }
    if (step !== 4) return null;
    const invalid = itemValidationError(items);
    if (invalid) { setError(invalid); return null; }
    if (!vehicle.trim()) { setFieldErrors(previous => ({ ...previous, vehicle: 'Wpisz markę i model pojazdu.' })); setStep(1); setError('Uzupełnij markę i model pojazdu.'); return null; }
    const digits = phone.replace(/\D/g, '');
    if (digits && digits !== '48' && (digits.length < 9 || digits.length > 15)) {
      setFieldErrors(previous => ({ ...previous, phone: 'Podaj numer z kodem kraju, np. 48 500 600 700, lub pozostaw pole puste.' }));
      setError('Sprawdź numer telefonu klienta.');
      return null;
    }
    setFieldErrors({ vehicle: '', phone: '' });
    savingRef.current = true;
    setSaving(true);
    setError('');
    try {
      const estimate = await addEstimate({ vehicleType, vehicle: vehicle.trim(), plate: plate.trim().toUpperCase(), phone: digits === '48' ? '' : digits, transcript, items });
      savedEstimate.current = estimate;
      return estimate;
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Nie udało się zapisać kosztorysu. Spróbuj ponownie.');
      return null;
    } finally { savingRef.current = false; setSaving(false); }
  }, [loaded, writable, step, vehicle, vehicleType, plate, phone, transcript, items, addEstimate]);
  return { step, vehicleType, setVehicleType, transcript, setTranscript, items, updateItem, addItem, removeItem, vehicle, setVehicle: changeVehicle, plate, setPlate, phone, setPhone: changePhone, error, fieldErrors, missingCount, saving, ...voice, next, back, goToStep, save, settings };
}
