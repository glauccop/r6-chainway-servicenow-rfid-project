export type CaptureType = 'rfid' | 'barcode' | 'qr';
export type Operation = 'read' | 'write';

export interface ScanItem {
  id: string;
  captureType: CaptureType;
  operation: Operation;
  epc?: string;
  tid?: string;
  userData?: string;
  rssi?: string;
  readCount: number;
  barcodeValue?: string;
  symbology?: string;
  capturedAt: string;
  raw: Record<string, unknown>;
}

export type BatchStatus = 'open' | 'sending' | 'sent' | 'error';

export interface ScanBatch {
  id: string;
  createdAt: string;
  notes: string;
  items: ScanItem[];
  status: BatchStatus;
  sentAt?: string;
  serverNumber?: string;
  lastError?: string;
}

export type AuthMode = 'oauth' | 'basic';

export interface Settings {
  instanceUrl: string;
  apiPath: string;
  authMode: AuthMode;
  username: string;
  password: string;
  clientId: string;
  clientSecret: string;
  debugEnabled: boolean;
  includeTid: boolean;
  lastDeviceAddress: string;
  lastDeviceName: string;
  installId: string;
}

export const DEFAULT_SETTINGS: Settings = {
  instanceUrl: '',
  apiPath: '/api/x_nowrfid/nowrfid',
  authMode: 'basic',
  username: '',
  password: '',
  clientId: '',
  clientSecret: '',
  debugEnabled: true,
  includeTid: true,
  lastDeviceAddress: '',
  lastDeviceName: '',
  installId: '',
};

export type ConnectionState = 'disconnected' | 'connecting' | 'connected';
