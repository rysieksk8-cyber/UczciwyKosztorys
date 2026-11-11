import { useCallback, useEffect, useRef, useState } from 'react';
import { decimalNumber } from '@/services/estimates';

// Keep the user's comma, trailing separator and empty text while editing, while
// synchronizing numeric changes from category switches and price calculations.
export function useDecimalField(value: number, onChange: (value: number) => void) {
  const [text, setText] = useState(String(value));
  const lastSent = useRef(value);
  useEffect(() => {
    if (value !== lastSent.current) setText(String(value));
    lastSent.current = value;
  }, [value]);
  const change = useCallback((next: string) => {
    setText(next);
    const number = decimalNumber(next) ?? 0;
    lastSent.current = number;
    onChange(number);
  }, [onChange]);
  return { value: text, onChangeText: change };
}
