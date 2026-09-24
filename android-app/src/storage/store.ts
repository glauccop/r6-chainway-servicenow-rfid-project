import { createAsyncStorage } from '@react-native-async-storage/async-storage';
import { DEFAULT_SETTINGS, ScanBatch, Settings } from '../types';
import { uuid } from '../utils/ids';

const storage = createAsyncStorage('nowrfid');

const KEYS = {
  settings: 'settings',
  batch: 'currentBatch',
  history: 'history',
};

async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await storage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export const store = {
  loadSettings: async (): Promise<Settings> => {
    const settings = {
      ...DEFAULT_SETTINGS,
      ...(await readJson<Partial<Settings>>(KEYS.settings, {})),
    };
    return settings.installId ? settings : { ...settings, installId: uuid() };
  },
  saveSettings: (s: Settings) =>
    storage.setItem(KEYS.settings, JSON.stringify(s)),
  loadBatch: () => readJson<ScanBatch | null>(KEYS.batch, null),
  saveBatch: (b: ScanBatch) => storage.setItem(KEYS.batch, JSON.stringify(b)),
  loadHistory: () => readJson<ScanBatch[]>(KEYS.history, []),
  saveHistory: (h: ScanBatch[]) =>
    storage.setItem(KEYS.history, JSON.stringify(h)),
};
