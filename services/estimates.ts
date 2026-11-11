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
const key = 'uczciwy-kosztorys-v1';
export const makeId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
export const money = (amount: number) => `${amount.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} zł`;
export const total = (items: EstimateItem[]) => Math.round(items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0) * 100) / 100;
export const sellingPrice = (purchase: number, markup: number) => Math.round(purchase * (1 + markup / 100) * 100) / 100;
export async function loadData(): Promise<StoredData> { const raw = await AsyncStorage.getItem(key); if (!raw) return { estimates: [], settings: defaultSettings }; const parsed = JSON.parse(raw); return { estimates: Array.isArray(parsed.estimates) ? parsed.estimates : [], settings: { ...defaultSettings, ...parsed.settings } }; }
export async function saveData(data: StoredData) { await AsyncStorage.setItem(key, JSON.stringify(data)); }
export function newItem(settings: WorkshopSettings, category: ItemCategory = 'labor'): EstimateItem { return { id: makeId(), name: '', category, quantity: 1, purchasePrice: 0, unitPrice: category === 'labor' ? settings.hourlyRate : 0, markup: settings.markup }; }
// Local deterministic item extraction; speech transcription is handled separately by OnSpace AI.
export function parseDescription(text: string, settings: WorkshopSettings): EstimateItem[] {
  return text.split(/[.\n;]+/).map(part => part.trim()).filter(Boolean).map(part => {
    const purchase = part.match(/(?:cena zakupu|zakup)\s*(\d+(?:[,.]\d+)?)/i);
    const price = part.match(/(?:cena|za)\s*(\d+(?:[,.]\d+)?)/i);
    const isLabor = /przegląd|wymiana|naprawa|robocizn|montaż|diagnosty/i.test(part);
    const category: ItemCategory = /materiał|płyn|smar|czyściwo/i.test(part) ? 'materials' : isLabor ? 'labor' : 'parts';
    const hours = part.match(/(\d+(?:[,.]\d+)?)\s*(?:godzin|h\b)/i);
    const qty = part.match(/(\d+(?:[,.]\d+)?)\s*szt/i);
    const purchasePrice = purchase ? Number(purchase[1].replace(',', '.')) : 0;
    const unitPrice = category === 'labor' ? (price ? Number(price[1].replace(',', '.')) : settings.hourlyRate) : purchase ? sellingPrice(purchasePrice, settings.markup) : price ? Number(price[1].replace(',', '.')) : 0;
    return { ...newItem(settings, category), name: part.replace(/,?\s*(?:cena zakupu|zakup|cena)\s*\d+(?:[,.]\d+)?\s*(?:złotych|zł)?/gi, '').replace(/,?\s*(?:\d+\s*)?godzin[a-y]*\s*robocizny/gi, '').trim(), quantity: Number((category === 'labor' ? hours?.[1] : qty?.[1])?.replace(',', '.') || 1), purchasePrice, unitPrice };
  });
}
