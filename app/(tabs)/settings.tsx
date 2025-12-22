import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useSettings } from '@/hooks/useSettings';
import { useTranslation } from '@/hooks/useTranslation';
import { spacing, borderRadius, ThemeColor } from '@/constants/theme';
import { useAlert } from '@/template';
import { Language } from '@/constants/translations';

const themeColors: { color: ThemeColor; icon: string }[] = [
  { color: 'blue', icon: 'water' },
  { color: 'pink', icon: 'heart' },
  { color: 'green', icon: 'leaf' },
  { color: 'purple', icon: 'sparkles' },
  { color: 'orange', icon: 'sunny' },
];

const languages: { code: Language; flag: string }[] = [
  { code: 'en', flag: '🇬🇧' },
  { code: 'nl', flag: '🇳🇱' },
  { code: 'hy', flag: '🇦🇲' },
];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { colors, typography, shadows } = useTheme();
  const { themeColor, setThemeColor, language, setLanguage } = useSettings();
  const { t } = useTranslation();
  const { showAlert } = useAlert();

  const handleThemeChange = async (color: ThemeColor) => {
    await setThemeColor(color);
    showAlert(t('settingsSaved'), t('preferencesUpdated'));
  };

  const handleLanguageChange = async (lang: Language) => {
    await setLanguage(lang);
    showAlert(t('settingsSaved'), t('preferencesUpdated'));
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      paddingTop: insets.top + spacing.md,
      paddingHorizontal: spacing.md,
      paddingBottom: insets.bottom + spacing.xl,
    },
    header: {
      marginBottom: spacing.lg,
    },
    title: {
      ...typography.title,
      marginBottom: spacing.xs,
    },
    subtitle: {
      ...typography.bodySmall,
    },
    section: {
      marginBottom: spacing.xl,
    },
    sectionTitle: {
      ...typography.subheading,
      marginBottom: spacing.md,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      ...shadows.sm,
    },
    optionGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.md,
    },
    colorOption: {
      width: 80,
      height: 80,
      borderRadius: borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 3,
      borderColor: 'transparent',
    },
    colorOptionSelected: {
      borderColor: colors.text,
    },
    colorLabel: {
      ...typography.caption,
      marginTop: spacing.xs,
      textAlign: 'center',
    },
    languageOption: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.md,
      borderRadius: borderRadius.md,
      backgroundColor: colors.surfaceVariant,
      marginBottom: spacing.sm,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    languageOptionSelected: {
      backgroundColor: colors.primaryLight,
      borderColor: colors.primary,
    },
    languageFlag: {
      fontSize: 32,
      marginRight: spacing.md,
    },
    languageText: {
      ...typography.body,
      flex: 1,
    },
    checkmark: {
      marginLeft: spacing.sm,
    },
    infoCard: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      alignItems: 'center',
      ...shadows.sm,
    },
    appVersion: {
      ...typography.caption,
      marginBottom: spacing.xs,
    },
    madeWithLove: {
      ...typography.bodySmall,
      textAlign: 'center',
    },
  });

  return (
    <View style={styles.container}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('appSettings')}</Text>
          <Text style={styles.subtitle}>{t('customizeYourExperience')}</Text>
        </View>

        {/* Theme Color Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('appearance')}</Text>
          <View style={styles.card}>
            <Text style={[styles.subtitle, { marginBottom: spacing.md }]}>
              {t('chooseThemeColor')}
            </Text>
            <View style={styles.optionGrid}>
              {themeColors.map((item) => (
                <TouchableOpacity
                  key={item.color}
                  onPress={() => handleThemeChange(item.color)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.colorOption,
                      {
                        backgroundColor:
                          item.color === 'blue'
                            ? '#3B82F6'
                            : item.color === 'pink'
                            ? '#EC4899'
                            : item.color === 'green'
                            ? '#10B981'
                            : item.color === 'purple'
                            ? '#8B5CF6'
                            : '#F97316',
                      },
                      themeColor === item.color && styles.colorOptionSelected,
                    ]}
                  >
                    <Ionicons name={item.icon as any} size={32} color="#FFFFFF" />
                  </View>
                  <Text style={styles.colorLabel}>
                    {t(item.color)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Language Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('language')}</Text>
          <View style={styles.card}>
            <Text style={[styles.subtitle, { marginBottom: spacing.md }]}>
              {t('chooseLanguage')}
            </Text>
            {languages.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.languageOption,
                  language === lang.code && styles.languageOptionSelected,
                ]}
                onPress={() => handleLanguageChange(lang.code)}
                activeOpacity={0.7}
              >
                <Text style={styles.languageFlag}>{lang.flag}</Text>
                <Text style={styles.languageText}>
                  {t(lang.code === 'en' ? 'english' : lang.code === 'nl' ? 'dutch' : 'armenian')}
                </Text>
                {language === lang.code && (
                  <Ionicons
                    name="checkmark-circle"
                    size={24}
                    color={colors.primary}
                    style={styles.checkmark}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('about')}</Text>
          <View style={styles.infoCard}>
            <Ionicons name="heart" size={48} color={colors.primary} />
            <Text style={[styles.appVersion, { marginTop: spacing.md }]}>
              {t('appVersion')}: 1.0.0
            </Text>
            <Text style={styles.madeWithLove}>{t('madeWithLove')}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
