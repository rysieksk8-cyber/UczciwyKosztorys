import { createContext, ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { defaultSettings, Estimate, itemValidationError, loadData, makeId, saveData, StoredData, WorkshopSettings } from '@/services/estimates';

type EstimateDraft = Omit<Estimate, 'id' | 'number' | 'createdAt' | 'workshop'>;
interface WorkshopContextValue {
  estimates: Estimate[];
  settings: WorkshopSettings;
  loaded: boolean;
  writable: boolean;
  storageError: string;
  addEstimate: (data: EstimateDraft) => Promise<Estimate>;
  deleteEstimate: (id: string) => Promise<void>;
  updateSettings: (settings: WorkshopSettings) => Promise<void>;
}
export const WorkshopContext = createContext<WorkshopContextValue | undefined>(undefined);
export function WorkshopProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<StoredData>({ estimates: [], settings: { ...defaultSettings } });
  const [loaded, setLoaded] = useState(false);
  const [writable, setWritable] = useState(false);
  const [storageError, setStorageError] = useState('');
  const dataRef = useRef(data);
  const queue = useRef<Promise<void>>(Promise.resolve());
  const storageReady = useRef(false);
  const alive = useRef(false);

  useEffect(() => {
    alive.current = true;
    let active = true;
    void loadData().then(result => {
      if (!active) return;
      dataRef.current = result;
      storageReady.current = true;
      setData(result);
      setWritable(true);
      setLoaded(true);
    }).catch(() => {
      if (!active) return;
      // Never replace unreadable history with an empty initial state.
      setStorageError('Nie udało się odczytać historii. Zapis jest wstrzymany, aby jej nie nadpisać. Uruchom aplikację ponownie; nie usuwaj jej danych.');
      setLoaded(true);
    });
    return () => { active = false; alive.current = false; };
  }, []);

  const persist = useCallback((change: (previous: StoredData) => StoredData): Promise<void> => {
    if (!storageReady.current) return Promise.reject(new Error('Pamięć nie jest gotowa. Nie nadpisano historii; uruchom aplikację ponownie.'));
    const operation = queue.current.then(async () => {
      const next = change(dataRef.current);
      try {
        await saveData(next);
      } catch {
        const message = 'Nie udało się zapisać zmiany na urządzeniu. Poprzednia historia pozostaje bez zmian. Sprawdź wolne miejsce i ponów zapis.';
        if (alive.current) setStorageError(message);
        throw new Error(message);
      }
      dataRef.current = next;
      if (alive.current) { setData(next); setStorageError(''); }
    });
    // A failed write must not poison later retries. The caller still receives the rejection.
    queue.current = operation.catch(() => undefined);
    return operation;
  }, []);

  const addEstimate = useCallback(async (draft: EstimateDraft): Promise<Estimate> => {
    const invalid = itemValidationError(draft.items);
    if (invalid) throw new Error(invalid);
    if (!draft.vehicle.trim()) throw new Error('Uzupełnij markę i model pojazdu.');
    const date = new Date();
    let estimate: Estimate | null = null;
    await persist(previous => {
      estimate = { ...draft, items: draft.items.map(item => ({ ...item })), id: makeId(), createdAt: date.toISOString(), number: `UK/${date.getFullYear()}/${String(previous.estimates.length + 1).padStart(3, '0')}-${date.getTime().toString().slice(-4)}`, workshop: { ...previous.settings } };
      return { ...previous, estimates: [estimate, ...previous.estimates] };
    });
    if (!estimate) throw new Error('Nie utworzono kosztorysu.');
    return estimate;
  }, [persist]);
  const deleteEstimate = useCallback(async (id: string) => {
    await persist(previous => ({ ...previous, estimates: previous.estimates.filter(item => item.id !== id) }));
  }, [persist]);
  const updateSettings = useCallback(async (settings: WorkshopSettings) => {
    await persist(previous => ({ ...previous, settings: { ...settings } }));
  }, [persist]);
  return <WorkshopContext.Provider value={{ ...data, loaded, writable, storageError, addEstimate, deleteEstimate, updateSettings }}>{children}</WorkshopContext.Provider>;
}
