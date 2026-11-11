import { useCallback, useState } from 'react';

export function useDisclosure(initialOpen = false) {
  const [open, setOpen] = useState(initialOpen);
  const toggle = useCallback(() => setOpen(value => !value), []);
  return { open, toggle };
}
