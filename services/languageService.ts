import { translations, Language } from '@/constants/translations';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LANGUAGE_STORAGE_KEY = '@babycare_language';

let currentLanguage: Language = 'en';

export function setLanguage(lang: Language): void {
  currentLanguage = lang;
}

export function getLanguage(): Language {
  return currentLanguage;
}

export function t(key: string, params?: Record<string, string | number>): string {
  const keys = key.split('.');
  let translation: any = translations[currentLanguage];
  
  for (const k of keys) {
    translation = translation?.[k];
  }
  
  if (typeof translation !== 'string') {
    // Fallback to English if translation not found
    translation = translations.en;
    for (const k of keys) {
      translation = translation?.[k];
    }
  }
  
  if (typeof translation !== 'string') {
    return key; // Return key if no translation found
  }
  
  // Replace params
  if (params) {
    Object.keys(params).forEach((paramKey) => {
      translation = translation.replace(`{{${paramKey}}}`, String(params[paramKey]));
    });
  }
  
  return translation;
}

export async function saveLanguagePreference(lang: Language): Promise<void> {
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  } catch (error) {
    console.error('Failed to save language preference:', error);
  }
}

export async function loadLanguagePreference(): Promise<Language> {
  try {
    const saved = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved && (saved === 'en' || saved === 'nl' || saved === 'hy')) {
      return saved as Language;
    }
  } catch (error) {
    console.error('Failed to load language preference:', error);
  }
  return 'en';
}
