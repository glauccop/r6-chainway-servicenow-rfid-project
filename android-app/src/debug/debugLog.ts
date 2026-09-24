import { useSyncExternalStore } from 'react';

export type DebugSource = 'reader' | 'http' | 'app';
export type DebugDirection = 'tx' | 'rx' | 'err' | 'info';

export interface DebugEntry {
  id: number;
  ts: number;
  source: DebugSource;
  direction: DebugDirection;
  title: string;
  detail: string;
}

const MAX_ENTRIES = 1000;

let entries: DebugEntry[] = [];
let seq = 0;
let enabled = true;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach(fn => fn());
}

function stringify(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }
  try {
    return JSON.stringify(value, null, 1);
  } catch {
    return String(value);
  }
}

export const debugLog = {
  log(
    source: DebugSource,
    direction: DebugDirection,
    title: string,
    detail: unknown = '',
  ) {
    if (!enabled) {
      return;
    }
    const entry: DebugEntry = {
      id: ++seq,
      ts: Date.now(),
      source,
      direction,
      title,
      detail: stringify(detail),
    };
    entries = [entry, ...entries].slice(0, MAX_ENTRIES);
    notify();
  },
  clear() {
    entries = [];
    notify();
  },
  setEnabled(value: boolean) {
    enabled = value;
  },
  getAll(): DebugEntry[] {
    return entries;
  },
  subscribe(fn: () => void): () => void {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  exportText(list: DebugEntry[] = entries): string {
    return [...list]
      .reverse()
      .map(
        e =>
          `${new Date(e.ts).toISOString()} [${
            e.source
          }] ${e.direction.toUpperCase()} ${e.title}\n${e.detail}`,
      )
      .join('\n\n');
  },
};

export function useDebugEntries(): DebugEntry[] {
  return useSyncExternalStore(debugLog.subscribe, debugLog.getAll);
}
