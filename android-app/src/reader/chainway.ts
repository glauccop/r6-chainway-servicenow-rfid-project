import { DeviceEventEmitter, EmitterSubscription } from 'react-native';
import Native from '../../specs/NativeChainwayRfid';
import { debugLog } from '../debug/debugLog';
import type { ConnectionState } from '../types';

// Event names must match the constants in ChainwayRfidModule.kt.
export const ReaderEvent = {
  deviceFound: 'ChainwayRfid.deviceFound',
  connection: 'ChainwayRfid.connection',
  tags: 'ChainwayRfid.tags',
  trigger: 'ChainwayRfid.trigger',
  locate: 'ChainwayRfid.locate',
  debug: 'ChainwayRfid.debug',
} as const;

export interface DeviceFound {
  address: string;
  name: string;
  rssi: number;
}

export interface ConnectionEvent {
  status: ConnectionState;
  address: string;
}

export interface TagRead {
  epc: string;
  tid: string;
  user: string;
  pc: string;
  rssi: string;
  antenna: string;
  count: number;
  timestamp: number;
}

export interface TriggerEvent {
  action: 'down' | 'up';
  keyCode: number;
}

export interface LocateEvent {
  value: number;
  valid: boolean;
}

export interface BarcodeRead {
  value: string;
  hex: string;
  ssiId: number;
  symbology: string;
}

export interface ReaderInfo {
  battery?: number;
  version?: string;
  temperature?: number;
  power?: number;
  frequencyMode?: number;
  bleHardwareVersion?: string;
}

interface NativeDebug {
  direction: 'tx' | 'rx' | 'err';
  command: string;
  detail: string;
}

// Values from the Chainway javadoc (com.rscja.deviceapi.interfaces.IUHF constants).
export const Bank = { RESERVED: 0, EPC: 1, TID: 2, USER: 3 } as const;
export const LockBank = {
  KILL: 16,
  ACCESS: 32,
  EPC: 48,
  TID: 64,
  USER: 80,
} as const;
export const LockMode = {
  LOCK: 16,
  OPEN: 32,
  PERMA_LOCK: 48,
  PERMA_OPEN: 64,
} as const;

// Region codes used by setFrequencyMode (from Chainway's uhf-ble demo, UHFSetFragment).
export const FREQUENCY_MODES: { code: number; label: string }[] = [
  { code: 0x3c, label: 'Brasil' },
  { code: 0x08, label: 'EUA (902-928 MHz)' },
  { code: 0x04, label: 'Europa (865-868 MHz)' },
  { code: 0x01, label: 'China 1 (840-845 MHz)' },
  { code: 0x02, label: 'China 2 (920-925 MHz)' },
  { code: 0x16, label: 'Coreia' },
  { code: 0x32, label: 'Japão' },
  { code: 0x33, label: 'África do Sul (915-919 MHz)' },
  { code: 0x34, label: 'Taiwan' },
  { code: 0x35, label: 'Vietnã (918-923 MHz)' },
  { code: 0x36, label: 'Peru (915-928 MHz)' },
  { code: 0x37, label: 'Rússia (860-867 MHz)' },
  { code: 0x80, label: 'Marrocos' },
  { code: 0x3b, label: 'Malásia' },
];

export function frequencyLabel(code?: number): string {
  return (
    FREQUENCY_MODES.find(f => f.code === code)?.label ??
    (code === undefined ? '-' : `0x${code.toString(16)}`)
  );
}

type Listener<T> = (payload: T) => void;

function on<T>(event: string, listener: Listener<T>): EmitterSubscription {
  return DeviceEventEmitter.addListener(event, listener as Listener<unknown>);
}

export const reader = {
  init: () => Native.initReader(),
  startScanDevices: () => Native.startScanDevices(),
  stopScanDevices: () => Native.stopScanDevices(),
  connect: (address: string) => Native.connect(address),
  disconnect: () => Native.disconnect(),
  getConnectionStatus: () =>
    Native.getConnectionStatus() as Promise<ConnectionState>,
  getReaderInfo: () => Native.getReaderInfo() as Promise<ReaderInfo>,

  startInventory: () => Native.startInventory(),
  stopInventory: () => Native.stopInventory(),
  inventorySingle: () => Native.inventorySingle() as Promise<TagRead | null>,
  setInventoryMode: (includeTid: boolean) =>
    Native.setInventoryMode(includeTid),
  setFilter: (bank: number, ptr: number, cnt: number, data: string) =>
    Native.setFilter(bank, ptr, cnt, data),

  readData: (
    pwd: string,
    bank: number,
    ptr: number,
    cnt: number,
    filterEpc = '',
  ) => Native.readData(pwd, bank, ptr, cnt, filterEpc),
  writeData: (
    pwd: string,
    bank: number,
    ptr: number,
    cnt: number,
    data: string,
    filterEpc = '',
  ) => Native.writeData(pwd, bank, ptr, cnt, data, filterEpc),
  writeEpc: (pwd: string, newEpc: string, filterEpc = '') =>
    Native.writeEpc(pwd, newEpc, filterEpc),
  eraseData: (
    pwd: string,
    bank: number,
    ptr: number,
    cnt: number,
    filterEpc = '',
  ) => Native.eraseData(pwd, bank, ptr, cnt, filterEpc),
  lockTag: (pwd: string, banks: number[], mode: number, filterEpc = '') =>
    Native.lockTag(pwd, banks, mode, filterEpc),
  killTag: (killPwd: string, filterEpc = '') =>
    Native.killTag(killPwd, filterEpc),

  startLocate: (epc: string) => Native.startLocate(epc),
  stopLocate: () => Native.stopLocate(),

  getPower: () => Native.getPower(),
  setPower: (power: number) => Native.setPower(power),
  getFrequencyMode: () => Native.getFrequencyMode(),
  setFrequencyMode: (mode: number) => Native.setFrequencyMode(mode),
  setBeep: (enabled: boolean) => Native.setBeep(enabled),
  factoryReset: () => Native.factoryReset(),

  scanBarcode: () => Native.scanBarcode() as Promise<BarcodeRead | null>,
  stopBarcode: () => Native.stopBarcode(),

  onDeviceFound: (fn: Listener<DeviceFound>) => on(ReaderEvent.deviceFound, fn),
  onConnection: (fn: Listener<ConnectionEvent>) =>
    on(ReaderEvent.connection, fn),
  onTags: (fn: Listener<TagRead[]>) => on(ReaderEvent.tags, fn),
  onTrigger: (fn: Listener<TriggerEvent>) => on(ReaderEvent.trigger, fn),
  onLocate: (fn: Listener<LocateEvent>) => on(ReaderEvent.locate, fn),
};

/** QR-family symbologies are tagged as 'qr', everything else from the imager as 'barcode'. */
export function isQrSymbology(symbology: string): boolean {
  return /qr/i.test(symbology);
}

let tapInstalled = false;

/**
 * Mirrors everything crossing the native bridge into the debug console:
 * SDK commands/responses (logged natively) plus every raw event payload.
 */
export function installReaderDebugTap() {
  if (tapInstalled) {
    return;
  }
  tapInstalled = true;
  on<NativeDebug>(ReaderEvent.debug, e =>
    debugLog.log('reader', e.direction, e.command, e.detail),
  );
  on<DeviceFound>(ReaderEvent.deviceFound, e =>
    debugLog.log('reader', 'rx', 'event deviceFound', e),
  );
  on<ConnectionEvent>(ReaderEvent.connection, e =>
    debugLog.log('reader', 'rx', 'event connection', e),
  );
  on<TagRead[]>(ReaderEvent.tags, e =>
    debugLog.log('reader', 'rx', `event tags (${e.length})`, e),
  );
  on<TriggerEvent>(ReaderEvent.trigger, e =>
    debugLog.log('reader', 'rx', 'event trigger', e),
  );
  on<LocateEvent>(ReaderEvent.locate, e =>
    debugLog.log('reader', 'rx', 'event locate', e),
  );
}
