import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from 'react';
import { debugLog } from '../debug/debugLog';
import { serviceNow } from '../network/serviceNow';
import {
  BarcodeRead,
  isQrSymbology,
  reader,
  ReaderInfo,
  TagRead,
} from '../reader/chainway';
import { store } from '../storage/store';
import {
  ConnectionState,
  DEFAULT_SETTINGS,
  Operation,
  ScanBatch,
  ScanItem,
  Settings,
} from '../types';
import { uuid } from '../utils/ids';

interface Connection {
  status: ConnectionState;
  address: string;
}

interface State {
  ready: boolean;
  settings: Settings;
  connection: Connection;
  readerInfo: ReaderInfo;
  batch: ScanBatch;
  history: ScanBatch[];
}

type Action =
  | {
      type: 'loaded';
      settings: Settings;
      batch: ScanBatch | null;
      history: ScanBatch[];
    }
  | { type: 'settings'; patch: Partial<Settings> }
  | { type: 'connection'; connection: Connection }
  | { type: 'readerInfo'; info: ReaderInfo }
  | { type: 'addItems'; items: ScanItem[] }
  | { type: 'removeItem'; id: string }
  | { type: 'notes'; notes: string }
  | { type: 'batchStatus'; status: ScanBatch['status']; error?: string }
  | { type: 'batchSent'; serverNumber: string }
  | { type: 'newBatch' };

const HISTORY_LIMIT = 30;

function emptyBatch(): ScanBatch {
  return {
    id: uuid(),
    createdAt: new Date().toISOString(),
    notes: '',
    items: [],
    status: 'open',
  };
}

function mergeKey(item: ScanItem): string | null {
  if (item.operation !== 'read') {
    return null;
  }
  if (item.captureType === 'rfid') {
    return item.epc ? `rfid:${item.epc}` : null;
  }
  return item.barcodeValue
    ? `${item.captureType}:${item.symbology}:${item.barcodeValue}`
    : null;
}

export function mergeItems(existing: ScanItem[], incoming: ScanItem[]): ScanItem[] {
  const result = [...existing];
  const index = new Map<string, number>();
  result.forEach((it, i) => {
    const key = mergeKey(it);
    if (key) {
      index.set(key, i);
    }
  });
  for (const item of incoming) {
    const key = mergeKey(item);
    const at = key ? index.get(key) : undefined;
    if (at === undefined) {
      if (key) {
        index.set(key, result.length);
      }
      result.push(item);
    } else {
      const prev = result[at];
      result[at] = {
        ...prev,
        readCount: prev.readCount + item.readCount,
        rssi: item.rssi || prev.rssi,
        tid: prev.tid || item.tid,
        userData: prev.userData || item.userData,
      };
    }
  }
  return result;
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'loaded':
      return {
        ...state,
        ready: true,
        settings: action.settings,
        batch: action.batch ?? emptyBatch(),
        history: action.history,
      };
    case 'settings':
      return { ...state, settings: { ...state.settings, ...action.patch } };
    case 'connection':
      return {
        ...state,
        connection: action.connection,
        readerInfo:
          action.connection.status === 'connected' ? state.readerInfo : {},
      };
    case 'readerInfo':
      return { ...state, readerInfo: { ...state.readerInfo, ...action.info } };
    case 'addItems':
      if (state.batch.status === 'sending') {
        return state;
      }
      return {
        ...state,
        batch: {
          ...state.batch,
          status: 'open',
          items: mergeItems(state.batch.items, action.items),
        },
      };
    case 'removeItem':
      return {
        ...state,
        batch: {
          ...state.batch,
          items: state.batch.items.filter(i => i.id !== action.id),
        },
      };
    case 'notes':
      return { ...state, batch: { ...state.batch, notes: action.notes } };
    case 'batchStatus':
      return {
        ...state,
        batch: {
          ...state.batch,
          status: action.status,
          lastError: action.error,
        },
      };
    case 'batchSent': {
      const sent: ScanBatch = {
        ...state.batch,
        status: 'sent',
        sentAt: new Date().toISOString(),
        serverNumber: action.serverNumber,
        lastError: undefined,
      };
      return {
        ...state,
        batch: emptyBatch(),
        history: [sent, ...state.history].slice(0, HISTORY_LIMIT),
      };
    }
    case 'newBatch':
      return { ...state, batch: emptyBatch() };
  }
}

export function tagToItem(
  tag: TagRead,
  operation: Operation = 'read',
  extra: Record<string, unknown> = {},
): ScanItem {
  return {
    id: uuid(),
    captureType: 'rfid',
    operation,
    epc: tag.epc,
    tid: tag.tid || undefined,
    userData: tag.user || undefined,
    rssi: tag.rssi || undefined,
    readCount: Math.max(1, tag.count || 1),
    capturedAt: new Date(tag.timestamp || Date.now()).toISOString(),
    raw: { ...tag, ...extra },
  };
}

export function barcodeToItem(code: BarcodeRead): ScanItem {
  return {
    id: uuid(),
    captureType: isQrSymbology(code.symbology) ? 'qr' : 'barcode',
    operation: 'read',
    barcodeValue: code.value,
    symbology: code.symbology,
    readCount: 1,
    capturedAt: new Date().toISOString(),
    raw: { ...code },
  };
}

interface AppContextValue extends State {
  updateSettings: (patch: Partial<Settings>) => void;
  addItems: (items: ScanItem[]) => void;
  removeItem: (id: string) => void;
  setNotes: (notes: string) => void;
  newBatch: () => void;
  sendBatch: () => Promise<void>;
  refreshReaderInfo: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    ready: false,
    settings: DEFAULT_SETTINGS,
    connection: { status: 'disconnected', address: '' },
    readerInfo: {},
    batch: emptyBatch(),
    history: [],
  });
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    (async () => {
      const [settings, batch, history] = await Promise.all([
        store.loadSettings(),
        store.loadBatch(),
        store.loadHistory(),
      ]);
      debugLog.setEnabled(settings.debugEnabled);
      // A batch interrupted mid-send is still pending on the device: let the user resend it.
      const restored =
        batch && batch.status === 'sending'
          ? {
              ...batch,
              status: 'error' as const,
              lastError: 'Envio interrompido',
            }
          : batch;
      dispatch({ type: 'loaded', settings, batch: restored, history });
      reader
        .init()
        .catch(e => debugLog.log('app', 'err', 'reader.init', String(e)));
    })();
  }, []);

  useEffect(() => {
    if (state.ready) {
      store.saveSettings(state.settings);
      debugLog.setEnabled(state.settings.debugEnabled);
    }
  }, [state.ready, state.settings]);

  useEffect(() => {
    if (state.ready) {
      store.saveBatch(state.batch);
    }
  }, [state.ready, state.batch]);

  useEffect(() => {
    if (state.ready) {
      store.saveHistory(state.history);
    }
  }, [state.ready, state.history]);

  const refreshReaderInfo = useCallback(async () => {
    try {
      dispatch({ type: 'readerInfo', info: await reader.getReaderInfo() });
    } catch (e) {
      debugLog.log('app', 'err', 'getReaderInfo', String(e));
    }
  }, []);

  useEffect(() => {
    const sub = reader.onConnection(evt => {
      dispatch({
        type: 'connection',
        connection: { status: evt.status, address: evt.address },
      });
      if (evt.status === 'connected') {
        reader
          .setInventoryMode(stateRef.current.settings.includeTid)
          .catch(() => undefined);
        refreshReaderInfo();
      }
    });
    return () => sub.remove();
  }, [refreshReaderInfo]);

  const sendBatch = useCallback(async () => {
    const { batch, settings, connection } = stateRef.current;
    if (!batch.items.length || batch.status === 'sending') {
      return;
    }
    dispatch({ type: 'batchStatus', status: 'sending' });
    try {
      const { data } = await serviceNow.sendBatch(settings, batch, {
        deviceId: settings.installId,
        readerMac: connection.address || settings.lastDeviceAddress,
      });
      const failed = data.errors?.length ?? 0;
      debugLog.log(
        'app',
        failed ? 'err' : 'info',
        `Lote ${data.batch_number} enviado`,
        data,
      );
      dispatch({ type: 'batchSent', serverNumber: data.batch_number });
    } catch (e) {
      dispatch({
        type: 'batchStatus',
        status: 'error',
        error: e instanceof Error ? e.message : String(e),
      });
      throw e;
    }
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      ...state,
      updateSettings: patch => dispatch({ type: 'settings', patch }),
      addItems: items => {
        if (items.length) {
          dispatch({ type: 'addItems', items });
        }
      },
      removeItem: id => dispatch({ type: 'removeItem', id }),
      setNotes: notes => dispatch({ type: 'notes', notes }),
      newBatch: () => dispatch({ type: 'newBatch' }),
      sendBatch,
      refreshReaderInfo,
    }),
    [state, sendBatch, refreshReaderInfo],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used inside AppStateProvider');
  }
  return ctx;
}
