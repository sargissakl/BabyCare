import { useSettings } from './useSettings';
import { t as translate } from '@/services/languageService';

export function useTranslation() {
  const { language } = useSettings();
  
  const t = (key: string, params?: Record<string, string | number>): string => {
    return translate(key, params);
  };
  
  return { t, language };
}
