// Native key-value storage: SQLite-backed `localStorage` (synchronous, survives restarts).
import 'expo-sqlite/localStorage/install';

export type KeyValueStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

export const kv: KeyValueStorage = globalThis.localStorage;
