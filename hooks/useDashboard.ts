import { useCallback, useMemo, useState } from 'react';
import { total } from '@/services/estimates';
import { useWorkshop } from './useWorkshop';
export function useDashboard() {
  const workshop = useWorkshop();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const now = new Date();
  const estimates = useMemo(() => workshop.estimates.filter(item => {
    const matchesPlate = item.plate.replace(/\s/g, '').toLowerCase().includes(query.replace(/\s/g, '').toLowerCase());
    const date = new Date(item.createdAt);
    return matchesPlate && (filter !== 'month' || (date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()));
  }), [workshop.estimates, query, filter, now.getMonth(), now.getFullYear()]);
  const summary = useMemo(() => { const current = workshop.estimates.filter(item => { const date = new Date(item.createdAt); return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear(); }); return { count: current.length, amount: current.reduce((sum, item) => sum + total(item.items), 0) }; }, [workshop.estimates, now.getMonth(), now.getFullYear()]);
  const changeFilter = useCallback((value: string) => setFilter(value), []);
  return { ...workshop, estimates, summary, query, setQuery, filter, changeFilter };
}
