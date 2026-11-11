import { EstimateItem } from '@/services/estimates';
import { itemNeedsAttention } from '@/services/estimateInsights';

export function useItemStatus(item: EstimateItem) {
  return {
    needsAttention: itemNeedsAttention(item),
    nameError: item.name.trim() ? '' : 'Uzupełnij nazwę pozycji.',
    quantityError: item.quantity > 0 && Number.isFinite(item.quantity) ? '' : 'Wpisz wartość większą od 0.',
    priceError: item.unitPrice > 0 && Number.isFinite(item.unitPrice) ? '' : 'Uzupełnij cenę brutto.',
    markupError: item.markup >= 0 && item.markup <= 1000 && Number.isFinite(item.markup) ? '' : 'Narzut: od 0 do 1000%.',
  };
}
