import { StyleSheet } from 'react-native';
import { colors, spacing, borderRadius } from './theme';

export const createGlobalStyles = (isDark: boolean) => {
  const theme = isDark ? colors.dark : colors.light;
  
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    centerContent: {
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    card: {
      backgroundColor: theme.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
    },
    row: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
    },
    spaceBetween: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
    },
  });
};
