import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useWorkshop } from './useWorkshop';
import { appointmentDay, appointmentRange, appointmentTimeZone, createAppointmentDraft, openGoogleCalendar, validateAppointment } from '@/services/calendar';
import type { AppointmentDraft, AppointmentErrors } from '@/services/calendar';

export function useAppointment(estimateId?: string) {
  const { settings, estimates, loaded } = useWorkshop();
  const estimate = useMemo(() => estimates.find(item => item.id === estimateId), [estimates, estimateId]);
  const [draft, setDraft] = useState<AppointmentDraft>(() => createAppointmentDraft(settings));
  const [errors, setErrors] = useState<AppointmentErrors>({});
  const [error, setError] = useState('');
  const [opened, setOpened] = useState(false);
  const [busy, setBusy] = useState(false);
  const initializedFor = useRef<string | null>(null);
  const working = useRef(false);
  const alive = useRef(true);
  const key = estimateId || 'new';
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  useEffect(() => {
    if (!loaded || initializedFor.current === key || (estimateId && !estimate)) return;
    initializedFor.current = key;
    setDraft(createAppointmentDraft(settings, estimate));
    setErrors({}); setError(''); setOpened(false);
  }, [loaded, key, estimateId, estimate, settings]);
  const change = useCallback((patch: Partial<AppointmentDraft>) => {
    if (working.current) return;
    setDraft(previous => ({ ...previous, ...patch }));
    setErrors({}); setError(''); setOpened(false);
  }, []);
  const chooseDay = useCallback((offset: number) => change({ date: appointmentDay(offset) }), [change]);
  const open = useCallback(async () => {
    if (working.current || !loaded || (estimateId && !estimate)) return;
    const invalid = validateAppointment(draft);
    setErrors(invalid); setError(''); setOpened(false);
    if (Object.keys(invalid).length) {
      setError('Sprawdź zaznaczone pola przed otwarciem kalendarza.');
      return;
    }
    working.current = true; setBusy(true);
    try {
      await openGoogleCalendar(draft);
      if (alive.current) setOpened(true);
    } catch (reason) {
      if (alive.current) setError(reason instanceof Error ? reason.message : 'Nie udało się otworzyć kalendarza. Spróbuj ponownie.');
    } finally {
      working.current = false;
      if (alive.current) setBusy(false);
    }
  }, [draft, loaded, estimateId, estimate]);
  const range = useMemo(() => appointmentRange(draft), [draft]);
  const summary = range ? `${range.start.toLocaleDateString('pl-PL')} · ${range.start.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })} – ${range.end.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}${range.start.getDate() !== range.end.getDate() ? ` (${range.end.toLocaleDateString('pl-PL')})` : ''}` : 'Uzupełnij poprawną datę i godzinę.';
  const timeZone = useMemo(() => appointmentTimeZone(), []);
  return { draft, errors, error, opened, busy, loaded, unavailable: loaded && Boolean(estimateId) && !estimate, change, chooseDay, open, summary, timeZone, today: appointmentDay(0), tomorrow: appointmentDay(1) };
}
