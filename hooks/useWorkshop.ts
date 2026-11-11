import { useContext } from 'react';
import { WorkshopContext } from '@/contexts/WorkshopContext';
export function useWorkshop() { const context = useContext(WorkshopContext); if (!context) throw new Error('useWorkshop requires WorkshopProvider'); return context; }
