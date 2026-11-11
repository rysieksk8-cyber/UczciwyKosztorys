import { useEffect, useState } from 'react';
import { Dimensions } from 'react-native';

export function useViewport() {
  const [size, setSize] = useState({ width: 375, height: 667 });
  useEffect(() => {
    const update = () => {
      const windowSize = Dimensions.get('window');
      setSize({ width: Math.max(1, windowSize.width || 375), height: Math.max(1, windowSize.height || 667) });
    };
    update();
    const subscription = Dimensions.addEventListener('change', update);
    return () => subscription.remove();
  }, []);
  return { ...size, wide: size.width >= 768 };
}
