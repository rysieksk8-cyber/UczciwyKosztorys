import { useMemo } from 'react';
import { EstimateItem, total } from '@/services/estimates';
import { categoryTotals, itemNeedsAttention } from '@/services/estimateInsights';

export function useEstimateSummary(items: EstimateItem[]) {
  return useMemo(() => ({ amount: total(items), categories: categoryTotals(items), missingCount: items.filter(itemNeedsAttention).length }), [items]);
}
