// Web key-value storage. Falls back to memory during static rendering (no `window`) or
// when storage is blocked (private mode, disabled cookies).
export type KeyValueStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

const memory = new Map<string, string>();
const memoryStorage: KeyValueStorage = {
  getItem: (key) => memory.get(key) ?? null,
  setItem: (key, value) => void memory.set(key, value),
  removeItem: (key) => void memory.delete(key),
};

function browserStorage(): KeyValueStorage | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    const probe = '__px_probe__';
    window.localStorage.setItem(probe, probe);
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    return null;
  }
}

export const kv: KeyValueStorage = {
  getItem: (key) => (browserStorage() ?? memoryStorage).getItem(key),
  setItem: (key, value) => {
    try {
      (browserStorage() ?? memoryStorage).setItem(key, value);
    } catch {
      memoryStorage.setItem(key, value);
    }
  },
  removeItem: (key) => (browserStorage() ?? memoryStorage).removeItem(key),
};
