import { createContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeColor } from '@/constants/theme';
import { Language, setLanguage as setGlobalLanguage, loadLanguagePreference, saveLanguagePreference } from '@/services/languageService';

const THEME_COLOR_STORAGE_KEY = '@babycare_theme_color';

interface SettingsContextType {
  themeColor: ThemeColor;
  setThemeColor: (color: ThemeColor) => Promise<void>;
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  loading: boolean;
}

export const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [themeColor, setThemeColorState] = useState<ThemeColor>('blue');
  const [language, setLanguageState] = useState<Language>('en');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // Load theme color
      const savedTheme = await AsyncStorage.getItem(THEME_COLOR_STORAGE_KEY);
      if (savedTheme && ['blue', 'pink', 'green', 'purple', 'orange'].includes(savedTheme)) {
        setThemeColorState(savedTheme as ThemeColor);
      }

      // Load language
      const savedLang = await loadLanguagePreference();
      setLanguageState(savedLang);
      setGlobalLanguage(savedLang);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const setThemeColor = async (color: ThemeColor) => {
    try {
      await AsyncStorage.setItem(THEME_COLOR_STORAGE_KEY, color);
      setThemeColorState(color);
    } catch (error) {
      console.error('Failed to save theme color:', error);
    }
  };

  const setLanguage = async (lang: Language) => {
    try {
      await saveLanguagePreference(lang);
      setLanguageState(lang);
      setGlobalLanguage(lang);
    } catch (error) {
      console.error('Failed to save language:', error);
    }
  };

  return (
    <SettingsContext.Provider value={{ themeColor, setThemeColor, language, setLanguage, loading }}>
      {children}
    </SettingsContext.Provider>
  );
}
