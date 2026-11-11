import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { useAlert } from '@/template';
import { createPdf, openWhatsApp, sharePdf } from '@/services/documents';
import { Estimate } from '@/services/estimates';
export function useDocument(estimate: Estimate | undefined) {
  const { showAlert } = useAlert();
  const [busy, setBusy] = useState('');
  const [uri, setUri] = useState('');
  const [phone, setPhone] = useState(estimate?.phone || '48');
  useEffect(() => { setPhone(estimate?.phone || '48'); setUri(''); }, [estimate?.id]);
  const working = useRef(false);
  const run = useCallback(async (action: string) => {
    if (!estimate || working.current) return;
    working.current = true; setBusy(action);
    try {
      if (action === 'share' && Platform.OS === 'web') throw new Error('W przeglądarce użyj „Drukuj / zapisz jako PDF”. Udostępnianie pliku działa na telefonie.');
      if (action === 'whatsapp') await openWhatsApp({ ...estimate, phone });
      else { const file = uri || await createPdf(estimate); if (file) setUri(file); if (action === 'share') await sharePdf(file); }
    } catch (reason) { showAlert('Dokument', reason instanceof Error ? reason.message : 'Nie udało się przygotować dokumentu. Spróbuj ponownie.'); }
    finally { working.current = false; setBusy(''); }
  }, [estimate, uri, phone, showAlert]);
  return { busy, uri, phone, setPhone, run };
}
