import { useContext } from 'react';
import { BabyContext } from '@/contexts/BabyContext';

export function useBaby() {
  const context = useContext(BabyContext);
  if (!context) {
    throw new Error('useBaby must be used within BabyProvider');
  }
  return context;
}
