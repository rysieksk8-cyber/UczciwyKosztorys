import { useCallback, useState } from 'react';
import type { NativeSyntheticEvent, TextInputFocusEventData } from 'react-native';

type FocusEvent = NativeSyntheticEvent<TextInputFocusEventData>;
export function useFieldFocus(onFocus?: (event: FocusEvent) => void, onBlur?: (event: FocusEvent) => void) {
  const [focused, setFocused] = useState(false);
  const focus = useCallback((event: FocusEvent) => { setFocused(true); onFocus?.(event); }, [onFocus]);
  const blur = useCallback((event: FocusEvent) => { setFocused(false); onBlur?.(event); }, [onBlur]);
  return { focused, focus, blur };
}
