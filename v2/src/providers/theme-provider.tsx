import { useColorScheme as useNativeWindScheme } from 'nativewind';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from 'react';

import { kv } from '@/lib/storage';
import { PALETTES, type Palette, type Scheme } from '@/theme/palette';

export type ThemePreference = 'dark' | 'light' | 'system';

type ThemeContextValue = {
  preference: ThemePreference;
  scheme: Scheme;
  palette: Palette;
  setPreference: (preference: ThemePreference) => void;
};

const STORAGE_KEY = 'px-theme';
const ThemeContext = createContext<ThemeContextValue | null>(null);

// Tiny external store around the persisted preference. The server snapshot is always
// "dark" so statically rendered HTML hydrates without mismatch, then React re-renders
// with the saved preference (the inline script in +html already set the right CSS class).
const listeners = new Set<() => void>();
function readPreference(): ThemePreference {
  const stored = kv.getItem(STORAGE_KEY);
  return stored === 'light' || stored === 'system' ? stored : 'dark';
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
function writePreference(next: ThemePreference) {
  kv.setItem(STORAGE_KEY, next);
  listeners.forEach((listener) => listener());
}
const serverPreference = (): ThemePreference => 'dark';

/** Dark by default; light and "follow the system" available in Paramètres. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const nativeWind = useNativeWindScheme();
  const preference = useSyncExternalStore(subscribe, readPreference, serverPreference);

  useEffect(() => {
    nativeWind.setColorScheme(preference);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- setColorScheme is stable
  }, [preference]);

  const setPreference = useCallback((next: ThemePreference) => writePreference(next), []);

  const scheme: Scheme =
    preference === 'system' ? (nativeWind.colorScheme === 'light' ? 'light' : 'dark') : preference;
  const value = useMemo(
    () => ({ preference, scheme, palette: PALETTES[scheme], setPreference }),
    [preference, scheme, setPreference],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be used inside ThemeProvider');
  return value;
}
