import AsyncStorage from '@react-native-async-storage/async-storage';

export type VehicleType = 'car' | 'motorcycle' | 'truck';
export type ItemCategory = 'labor' | 'parts' | 'materials';
export interface EstimateItem { id: string; name: string; category: ItemCategory; quantity: number; purchasePrice: number; unitPrice: number; markup: number }
export interface Estimate { id: string; number: string; createdAt: string; vehicleType: VehicleType; vehicle: string; plate: string; phone: string; transcript: string; items: EstimateItem[]; workshop: WorkshopSettings }
export interface WorkshopSettings { name: string; address: string; phone: string; logo: string; hourlyRate: number; markup: number }
export interface StoredData { estimates: Estimate[]; settings: WorkshopSettings }
export const defaultSettings: WorkshopSettings = { name: 'Twój warsztat', address: '', phone: '', logo: '', hourlyRate: 150, markup: 25 };
export const vehicleLabels: Record<VehicleType, string> = { car: 'Samochód', motorcycle: 'Motocykl', truck: 'Ciężarówka' };
export const categoryLabels: Record<ItemCategory, string> = { labor: 'Robocizna', parts: 'Części', materials: 'Materiały' };
// Preserve the original storage key after the rename; never migrate by clearing it.
const key = 'uczciwy-kosztorys-v1';
export const makeId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
export const money = (amount: number) => `${amount.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} zł`;
export const lineTotal = (item: EstimateItem) => Math.round((item.quantity * item.unitPrice + Number.EPSILON) * 100) / 100;
export const total = (items: EstimateItem[]) => Math.round(items.reduce((sum, item) => sum + lineTotal(item), 0) * 100) / 100;
export const sellingPrice = (purchase: number, markup: number) => Math.round(purchase * (1 + markup / 100) * 100) / 100;

export function decimalNumber(text: string): number | null {
  const normalized = text.trim().replace(/\s/g, '').replace(',', '.');
  if (!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized)) return null;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}
export function itemValidationError(items: EstimateItem[]): string {
  if (!items.length) return 'Dodaj przynajmniej jedną pozycję.';
  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    const prefix = `Pozycja ${index + 1}: `;
    if (!item.name.trim()) return `${prefix}wpisz nazwę pracy lub części.`;
    if (!['labor', 'parts', 'materials'].includes(item.category)) return `${prefix}wybierz rodzaj pozycji.`;
    if (!Number.isFinite(item.quantity) || item.quantity <= 0) return `${prefix}podaj ilość lub czas większy od zera.`;
    if (!Number.isFinite(item.unitPrice) || item.unitPrice <= 0) return `${prefix}uzupełnij cenę brutto większą od zera.`;
    if (!Number.isFinite(item.purchasePrice) || item.purchasePrice < 0) return `${prefix}cena zakupu nie może być ujemna.`;
    if (!Number.isFinite(item.markup) || item.markup < 0 || item.markup > 1000) return `${prefix}podaj narzut od 0 do 1000%.`;
  }
  return Number.isFinite(total(items)) ? '' : 'Kwota kosztorysu jest zbyt duża.';
}
function validSettings(value: unknown): value is WorkshopSettings {
  if (!value || typeof value !== 'object') return false;
  const settings = value as WorkshopSettings;
  return ['name', 'address', 'phone', 'logo'].every(field => typeof settings[field as keyof WorkshopSettings] === 'string') && Number.isFinite(settings.hourlyRate) && settings.hourlyRate > 0 && Number.isFinite(settings.markup) && settings.markup >= 0 && settings.markup <= 1000;
}
function validEstimate(value: unknown): value is Estimate {
  if (!value || typeof value !== 'object') return false;
  const estimate = value as Estimate;
  return ['id', 'number', 'createdAt', 'vehicle', 'plate', 'phone', 'transcript'].every(field => typeof estimate[field as keyof Estimate] === 'string') && Number.isFinite(Date.parse(estimate.createdAt)) && ['car', 'motorcycle', 'truck'].includes(estimate.vehicleType) && validSettings(estimate.workshop) && Array.isArray(estimate.items) && estimate.items.every(item => item && typeof item.id === 'string' && typeof item.name === 'string') && !itemValidationError(estimate.items);
}
export async function loadData(): Promise<StoredData> {
  const raw = await AsyncStorage.getItem(key);
  if (raw === null) return { estimates: [], settings: { ...defaultSettings } };
  const parsed = JSON.parse(raw);
  if (!parsed || !Array.isArray(parsed.estimates) || !parsed.settings || typeof parsed.settings !== 'object') throw new Error('Nieprawidłowy zapis danych.');
  const settings = { ...defaultSettings, ...parsed.settings };
  if (!validSettings(settings) || !parsed.estimates.every(validEstimate)) throw new Error('Nieprawidłowe dane w pamięci. Nie nadpisano historii.');
  return { estimates: parsed.estimates, settings };
}
export async function saveData(data: StoredData): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(data));
}
export function newItem(settings: WorkshopSettings, category: ItemCategory = 'labor'): EstimateItem {
  return { id: makeId(), name: '', category, quantity: 1, purchasePrice: 0, unitPrice: category === 'labor' ? settings.hourlyRate : 0, markup: settings.markup };
}
// Deterministic extraction only. No AI calls, guessed part prices or audio uploads.
export function parseDescription(text: string, settings: WorkshopSettings): EstimateItem[] {
  // Neither decimal punctuation nor common unit abbreviations separate items.
  const source = text.replace(/\b(szt|godz|np)\./gi, '$1');
  const parts = source.split(/[\n;]+|\.(?!\d)|,\s*(?=(?:wymiana|przegląd|naprawa|montaż|diagnostyka|robocizna|części|materiały)\b)/i);
  return parts.map(part => part.trim()).filter(Boolean).map(part => {
    const purchase = part.match(/(?:cena zakupu|zakup)\s*:?\s*(\d+(?:[,.]\d+)?)/i);
    const price = part.match(/(?:cena(?: sprzedaży)?|stawka|za)\s*:?\s*(\d+(?:[,.]\d+)?)/i);
    const isLabor = /przegląd|wymiana|naprawa|robocizn|montaż|diagnosty/i.test(part);
    const category: ItemCategory = isLabor ? 'labor' : /materiał|płyn|smar|czyściwo/i.test(part) ? 'materials' : 'parts';
    const hours = part.match(/(\d+(?:[,.]\d+)?)\s*(?:godzin[a-ząćęłńóśźż]*|godz\b|h\b)/i);
    const qty = part.match(/(\d+(?:[,.]\d+)?)\s*szt/i);
    const purchasePrice = purchase ? decimalNumber(purchase[1]) ?? 0 : 0;
    const statedPrice = price ? decimalNumber(price[1]) ?? 0 : null;
    const unitPrice = category === 'labor' ? statedPrice ?? settings.hourlyRate : purchase ? sellingPrice(purchasePrice, settings.markup) : statedPrice ?? 0;
    const name = part.replace(/,?\s*(?:cena zakupu|zakup|cena(?: sprzedaży)?|stawka)\s*:?\s*\d+(?:[,.]\d+)?\s*(?:złotych|zł)?/gi, '').replace(/,?\s*\d+(?:[,.]\d+)?\s*godzin[a-ząćęłńóśźż]*\s*robocizny/gi, '').trim();
    return { ...newItem(settings, category), name: name || part, quantity: decimalNumber((category === 'labor' ? hours?.[1] : qty?.[1]) ?? '1') ?? 1, purchasePrice, unitPrice };
  });
}
