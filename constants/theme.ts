export type ThemeColor = 'blue' | 'pink' | 'green' | 'purple' | 'orange';

export const colorSchemes: Record<ThemeColor, {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  accent: string;
  success: string;
  successLight: string;
  warning: string;
  error: string;
}> = {
  blue: {
    primary: '#3B82F6',
    primaryLight: '#DBEAFE',
    primaryDark: '#1E40AF',
    accent: '#8B5CF6',
    success: '#10B981',
    successLight: '#D1FAE5',
    warning: '#F59E0B',
    error: '#EF4444',
  },
  pink: {
    primary: '#EC4899',
    primaryLight: '#FCE7F3',
    primaryDark: '#BE185D',
    accent: '#F472B6',
    success: '#10B981',
    successLight: '#D1FAE5',
    warning: '#F59E0B',
    error: '#EF4444',
  },
  green: {
    primary: '#10B981',
    primaryLight: '#D1FAE5',
    primaryDark: '#047857',
    accent: '#34D399',
    success: '#10B981',
    successLight: '#D1FAE5',
    warning: '#F59E0B',
    error: '#EF4444',
  },
  purple: {
    primary: '#8B5CF6',
    primaryLight: '#EDE9FE',
    primaryDark: '#6D28D9',
    accent: '#A78BFA',
    success: '#10B981',
    successLight: '#D1FAE5',
    warning: '#F59E0B',
    error: '#EF4444',
  },
  orange: {
    primary: '#F97316',
    primaryLight: '#FFEDD5',
    primaryDark: '#C2410C',
    accent: '#FB923C',
    success: '#10B981',
    successLight: '#D1FAE5',
    warning: '#F59E0B',
    error: '#EF4444',
  },
};

export const commonColors = {
  background: '#F9FAFB',
  surface: '#FFFFFF',
  surfaceVariant: '#F3F4F6',
  text: '#111827',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  border: '#E5E7EB',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const typography = {
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: commonColors.text,
    lineHeight: 36,
  },
  heading: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: commonColors.text,
    lineHeight: 32,
  },
  subheading: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: commonColors.text,
    lineHeight: 24,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    color: commonColors.text,
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400' as const,
    color: commonColors.textSecondary,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    color: commonColors.textTertiary,
    lineHeight: 16,
  },
  button: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 16,
  },
};
