import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

// Codegen spec for the Kotlin module wrapping Chainway's RFIDWithUHFBLE (R6 sled).
// Events are emitted through DeviceEventEmitter; names live in src/reader/events.ts.
export interface Spec extends TurboModule {
  initReader(): Promise<boolean>;
  startScanDevices(): void;
  stopScanDevices(): void;
  connect(address: string): void;
  disconnect(): void;
  getConnectionStatus(): Promise<string>;
  getReaderInfo(): Promise<Object>;

  startInventory(): Promise<boolean>;
  stopInventory(): Promise<boolean>;
  inventorySingle(): Promise<Object>;
  setInventoryMode(includeTid: boolean): Promise<boolean>;
  setFilter(
    bank: number,
    ptr: number,
    cnt: number,
    data: string,
  ): Promise<boolean>;

  readData(
    accessPwd: string,
    bank: number,
    ptr: number,
    cnt: number,
    filterEpc: string,
  ): Promise<string>;
  writeData(
    accessPwd: string,
    bank: number,
    ptr: number,
    cnt: number,
    data: string,
    filterEpc: string,
  ): Promise<boolean>;
  writeEpc(
    accessPwd: string,
    newEpc: string,
    filterEpc: string,
  ): Promise<boolean>;
  eraseData(
    accessPwd: string,
    bank: number,
    ptr: number,
    cnt: number,
    filterEpc: string,
  ): Promise<boolean>;
  lockTag(
    accessPwd: string,
    lockBanks: Array<number>,
    lockMode: number,
    filterEpc: string,
  ): Promise<boolean>;
  killTag(killPwd: string, filterEpc: string): Promise<boolean>;

  startLocate(epc: string): Promise<boolean>;
  stopLocate(): Promise<boolean>;

  getPower(): Promise<number>;
  setPower(power: number): Promise<boolean>;
  getFrequencyMode(): Promise<number>;
  setFrequencyMode(mode: number): Promise<boolean>;
  setBeep(enabled: boolean): Promise<boolean>;
  factoryReset(): Promise<boolean>;

  scanBarcode(): Promise<Object>;
  stopBarcode(): Promise<boolean>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('ChainwayRfid');
