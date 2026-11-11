import { createContext, ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { defaultSettings, Estimate, loadData, makeId, saveData, StoredData, WorkshopSettings } from '@/services/estimates';
interface WorkshopContextValue { estimates: Estimate[]; settings: WorkshopSettings; loaded: boolean; storageError: string; addEstimate: (data: Omit<Estimate, 'id' | 'number' | 'createdAt' | 'workshop'>) => Estimate; deleteEstimate: (id: string) => void; updateSettings: (settings: WorkshopSettings) => void }
export const WorkshopContext = createContext<WorkshopContextValue | undefined>(undefined);
export function WorkshopProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<StoredData>({ estimates: [], settings: defaultSettings });
  const [loaded, setLoaded] = useState(false);
  const [storageError, setStorageError] = useState('');
  const queue = useRef(Promise.resolve());
  const storageReady = useRef(false);
  useEffect(() => { let active = true; loadData().then(result => { if (active) { storageReady.current = true; setData(result); setLoaded(true); } }).catch(() => { if (active) { setStorageError('Nie udało się odczytać pamięci. Nowe dane pozostaną w tej sesji, aby nie nadpisać zapisów.'); setLoaded(true); } }); return () => { active = false; }; }, []);
  useEffect(() => { if (!loaded || !storageReady.current) return; queue.current = queue.current.then(() => saveData(data)).then(() => setStorageError('')).catch(() => { setStorageError('Nie udało się zapisać danych na urządzeniu. Nie zamykaj aplikacji.'); }); }, [data, loaded]);
  const addEstimate = useCallback((draft: Omit<Estimate, 'id' | 'number' | 'createdAt' | 'workshop'>) => {
    const date = new Date();
    const estimate: Estimate = { ...draft, id: makeId(), createdAt: date.toISOString(), number: `UK/${date.getFullYear()}/${String(data.estimates.length + 1).padStart(3, '0')}-${date.getTime().toString().slice(-4)}`, workshop: { ...data.settings } };
    setData(previous => ({ ...previous, estimates: [estimate, ...previous.estimates] }));
    return estimate;
  }, [data.estimates.length, data.settings]);
  const deleteEstimate = useCallback((id: string) => setData(previous => ({ ...previous, estimates: previous.estimates.filter(item => item.id !== id) })), []);
  const updateSettings = useCallback((settings: WorkshopSettings) => setData(previous => ({ ...previous, settings })), []);
  return <WorkshopContext.Provider value={{ ...data, loaded, storageError, addEstimate, deleteEstimate, updateSettings }}>{children}</WorkshopContext.Provider>;
}
