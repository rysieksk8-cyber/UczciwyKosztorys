import { useCallback, useRef, useState } from 'react';
import { EstimateItem, ItemCategory, newItem, parseDescription, sellingPrice, VehicleType } from '@/services/estimates';
import { useWorkshop } from './useWorkshop';
import { useVoiceRecognition } from './useVoiceRecognition';
export function useEstimateDraft() {
  const { settings, addEstimate } = useWorkshop();
  const [step, setStep] = useState(1);
  const [vehicleType, setVehicleType] = useState<VehicleType>('car');
  const [transcript, setTranscript] = useState('');
  const [items, setItems] = useState<EstimateItem[]>([]);
  const [vehicle, setVehicle] = useState('');
  const [plate, setPlate] = useState('');
  const [phone, setPhone] = useState('48');
  const [error, setError] = useState('');
  const parsedText = useRef('');
  const onRecognized = useCallback((text: string) => {
    setTranscript(previous => previous.trim() ? `${previous.trim()}\n${text}` : text);
    setError('');
  }, []);
  const voice = useVoiceRecognition({ onRecognized });
  const { recording, recordBusy } = voice;
  const updateItem = useCallback((id: string, patch: Partial<EstimateItem>) => setItems(previous => previous.map(item => { if (item.id !== id) return item; const updated = { ...item, ...patch }; if (updated.category !== 'labor' && (patch.purchasePrice !== undefined || patch.markup !== undefined)) updated.unitPrice = sellingPrice(updated.purchasePrice, updated.markup); if (patch.category !== undefined && patch.category !== item.category) { updated.unitPrice = patch.category === 'labor' ? settings.hourlyRate : sellingPrice(updated.purchasePrice, updated.markup); } return updated; })), [settings.hourlyRate]);
  const addItem = useCallback((category: ItemCategory = 'labor') => setItems(previous => [...previous, newItem(settings, category)]), [settings]);
  const removeItem = useCallback((id: string) => setItems(previous => previous.filter(item => item.id !== id)), []);
  const next = useCallback(() => {
    setError('');
    if (step === 2) { if (recording || recordBusy) { setError('Zatrzymaj nagranie i poczekaj na zakończenie rozpoznawania.'); return; } if (!transcript.trim()) { setError('Nagraj opis pracy albo wpisz go ręcznie.'); return; } if (parsedText.current !== transcript || !items.length) { setItems(parseDescription(transcript, settings)); parsedText.current = transcript; } }
    if (step === 3 && (!items.length || items.some(item => !item.name.trim() || item.quantity <= 0 || item.unitPrice <= 0 || !Number.isFinite(item.quantity * item.unitPrice)))) { setError('Dodaj pozycje i uzupełnij nazwy, dodatnie ilości oraz ceny.'); return; }
    if (step === 2 && !vehicle) setVehicle('');
    setStep(value => Math.min(4, value + 1));
  }, [step, transcript, settings, items, recording, recordBusy, vehicle]);
  const back = useCallback(() => { setError(''); setStep(value => Math.max(1, value - 1)); }, []);
  const save = useCallback(() => {
    if (!vehicle.trim()) { setError('Uzupełnij markę i model pojazdu.'); return null; }
    const digits = phone.replace(/\D/g, '');
    if (digits && digits !== '48' && (digits.length < 9 || digits.length > 15)) { setError('Podaj numer klienta z kodem kraju lub pozostaw pole puste.'); return null; }
    return addEstimate({ vehicleType, vehicle: vehicle.trim(), plate: plate.trim().toUpperCase(), phone: digits === '48' ? '' : digits, transcript, items });
  }, [vehicle, vehicleType, plate, phone, transcript, items, addEstimate]);
  return { step, vehicleType, setVehicleType, transcript, setTranscript, items, updateItem, addItem, removeItem, vehicle, setVehicle, plate, setPlate, phone, setPhone, error, ...voice, next, back, save, settings };
}
