import { Estimate, EstimateItem, ItemCategory, lineTotal } from './estimates';

// Local presentation helpers. No network, transcription or AI requests.
export function normalizeSearch(value: string): string {
  return value.toLocaleLowerCase('pl-PL').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ł/g, 'l').replace(/\s/g, '');
}

export function matchesEstimate(estimate: Estimate, query: string): boolean {
  const words = query.trim().split(/\s+/).filter(Boolean);
  const fields = [estimate.vehicle, estimate.plate, estimate.number].map(normalizeSearch);
  const combined = fields.join(' ');
  return words.every(word => combined.includes(normalizeSearch(word)));
}

export function categoryTotals(items: EstimateItem[]): Record<ItemCategory, number> {
  const sums: Record<ItemCategory, number> = { labor: 0, parts: 0, materials: 0 };
  for (const item of items) sums[item.category] += lineTotal(item);
  for (const category of ['labor', 'parts', 'materials'] as ItemCategory[]) sums[category] = Math.round(sums[category] * 100) / 100;
  return sums;
}

export function itemNeedsAttention(item: EstimateItem): boolean {
  return !item.name.trim() || !Number.isFinite(item.quantity) || item.quantity <= 0 || !Number.isFinite(item.unitPrice) || item.unitPrice <= 0 || !Number.isFinite(item.purchasePrice) || item.purchasePrice < 0 || !Number.isFinite(item.markup) || item.markup < 0 || item.markup > 1000;
}
