import { useColorScheme } from 'react-native';
import { colors } from './colors';

export type AppColors = typeof colors.light;

/** Returns the active palette based on the OS color scheme. */
export function useColors(): AppColors {
  const scheme = useColorScheme();
  return scheme === 'dark' ? colors.dark : colors.light;
}
