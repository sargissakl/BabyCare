import { useSettings } from './useSettings';
import { colorSchemes } from '@/constants/theme';
import { spacing, borderRadius, typography, shadows, commonColors } from '@/constants/theme';

export function useTheme() {
  const { themeColor } = useSettings();
  const selectedColors = colorSchemes[themeColor];
  
  return {
    colors: {
      ...selectedColors,
      ...commonColors,
    },
    spacing,
    borderRadius,
    typography,
    shadows,
  };
}
