import { Linking } from 'react-native';
import type { Estimate, WorkshopSettings } from './estimates';

export const appointmentDurations = [30, 60, 120, 180] as const;
export interface AppointmentDraft {
  vehicle: string;
  plate: string;
  client: string;
  phone: string;
  date: string;
  time: string;
  duration: number;
  description: string;
  location: string;
  estimateNumber: string;
}
export type AppointmentErrors = Partial<Record<keyof AppointmentDraft, string>>;
export interface AppointmentRange { start: Date; end: Date }

export function formatAppointmentDate(date: Date): string {
  return `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}.${date.getFullYear()}`;
}
export function appointmentDay(offset: number, now = new Date()): string {
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset, 12);
  return formatAppointmentDate(date);
}
export function createAppointmentDraft(settings: WorkshopSettings, estimate?: Estimate): AppointmentDraft {
  return {
    vehicle: estimate?.vehicle ?? '', plate: estimate?.plate ?? '', client: '', phone: estimate?.phone ?? '',
    date: appointmentDay(1), time: '09:00', duration: 60,
    description: estimate?.items.map(item => item.name).join('\n').slice(0, 500) ?? '',
    location: settings.address, estimateNumber: estimate?.number ?? '',
  };
}
export function appointmentRange(draft: AppointmentDraft): AppointmentRange | null {
  const dateMatch = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(draft.date.trim());
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(draft.time.trim());
  if (!dateMatch || !timeMatch) return null;
  const [, dayText, monthText, yearText] = dateMatch;
  const [, hourText, minuteText] = timeMatch;
  const day = Number(dayText), month = Number(monthText), year = Number(yearText);
  const hour = Number(hourText), minute = Number(minuteText);
  if (year < 2000 || year > 2100 || month < 1 || month > 12 || day < 1 || hour > 23 || minute > 59) return null;
  if (!Number.isInteger(draft.duration) || draft.duration < 15 || draft.duration > 480) return null;
  const start = new Date(year, month - 1, day, hour, minute, 0, 0);
  // Reject impossible dates and local times skipped during daylight-saving changes.
  if (start.getFullYear() !== year || start.getMonth() !== month - 1 || start.getDate() !== day || start.getHours() !== hour || start.getMinutes() !== minute) return null;
  return { start, end: new Date(start.getTime() + draft.duration * 60000) };
}
export function validateAppointment(draft: AppointmentDraft, now = new Date()): AppointmentErrors {
  const errors: AppointmentErrors = {};
  if (!draft.vehicle.trim()) errors.vehicle = 'Wpisz markę i model pojazdu.';
  if (draft.vehicle.length > 100) errors.vehicle = 'Nazwa pojazdu może mieć maksymalnie 100 znaków.';
  if (!/^\d{2}\.\d{2}\.\d{4}$/.test(draft.date.trim())) errors.date = 'Podaj datę w formacie DD.MM.RRRR.';
  if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(draft.time.trim())) errors.time = 'Podaj godzinę w formacie GG:MM, np. 09:30.';
  if (!Number.isInteger(draft.duration) || draft.duration < 15 || draft.duration > 480) errors.duration = 'Czas wizyty musi wynosić od 15 do 480 minut.';
  const range = appointmentRange(draft);
  if (!range && !errors.date && !errors.time && !errors.duration) errors.date = 'Ta data lub godzina nie istnieje. Sprawdź termin wizyty.';
  if (range && range.start.getTime() <= now.getTime()) errors.time = 'Wybierz termin w przyszłości.';
  if (draft.client.length > 100) errors.client = 'Dane klienta mogą mieć maksymalnie 100 znaków.';
  if (draft.plate.length > 20) errors.plate = 'Rejestracja może mieć maksymalnie 20 znaków.';
  if (draft.phone.trim() && (!/^[+\d\s()\-]{5,30}$/.test(draft.phone.trim()) || !/^\d{5,15}$/.test(draft.phone.replace(/\D/g, '')))) errors.phone = 'Sprawdź numer telefonu albo pozostaw pole puste.';
  if (draft.description.length > 500) errors.description = 'Opis może mieć maksymalnie 500 znaków.';
  if (draft.location.length > 200) errors.location = 'Adres może mieć maksymalnie 200 znaków.';
  return errors;
}
export function appointmentTimeZone(): string {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch { return ''; }
}
export function buildGoogleCalendarUrl(draft: AppointmentDraft, now = new Date()): string {
  const errors = validateAppointment(draft, now);
  const firstError = Object.values(errors)[0];
  if (firstError) throw new Error(firstError);
  const range = appointmentRange(draft);
  if (!range) throw new Error('Sprawdź datę i godzinę wizyty.');
  const title = ['Naprawa', draft.vehicle.trim(), draft.plate.trim()].filter(Boolean).join(' · ');
  const details = [
    'Wizyta przygotowana w aplikacji Kosztorys Mechanika.',
    draft.client.trim() ? `Klient: ${draft.client.trim()}` : '',
    draft.phone.trim() ? `Telefon klienta: ${draft.phone.trim()}` : '',
    draft.estimateNumber ? `Kosztorys: ${draft.estimateNumber}` : '',
    draft.description.trim(),
  ].filter(Boolean).join('\n');
  // Convert device-local times to unambiguous UTC instants, including summer/winter time.
  const googleDate = (date: Date) => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const params: Record<string, string> = {
    action: 'TEMPLATE', text: title, dates: `${googleDate(range.start)}/${googleDate(range.end)}`,
    details, location: draft.location.trim(),
  };
  const timeZone = appointmentTimeZone();
  if (timeZone) params.ctz = timeZone;
  const query = Object.entries(params).map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join('&');
  return `https://calendar.google.com/calendar/render?${query}`;
}
export async function openGoogleCalendar(draft: AppointmentDraft): Promise<void> {
  const url = buildGoogleCalendarUrl(draft);
  try { await Linking.openURL(url); }
  catch { throw new Error('Nie udało się otworzyć Kalendarza Google. Sprawdź przeglądarkę i połączenie z internetem, a następnie spróbuj ponownie.'); }
}
