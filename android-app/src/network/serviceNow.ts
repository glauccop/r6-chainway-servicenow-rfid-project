import { debugLog } from '../debug/debugLog';
import type { ScanBatch, ScanItem, Settings } from '../types';
import { base64 } from '../utils/ids';

export const APP_VERSION = '0.1.0';

interface Token {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  key: string;
}

let cachedToken: Token | null = null;

export class ServiceNowError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly body?: unknown,
  ) {
    super(message);
  }
}

function baseUrl(settings: Settings): string {
  const url = settings.instanceUrl.trim().replace(/\/+$/, '');
  if (!url) {
    throw new ServiceNowError('URL da instância não configurada');
  }
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

function redactHeaders(
  headers: Record<string, string>,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(headers).map(([k, v]) => [
      k,
      /authorization/i.test(k) ? `${v.split(' ')[0]} ***` : v,
    ]),
  );
}

async function parseBody(res: Response): Promise<unknown> {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text;
  }
}

async function logged(
  method: string,
  url: string,
  headers: Record<string, string>,
  body?: string,
  logBody?: unknown,
) {
  debugLog.log('http', 'tx', `${method} ${url}`, {
    headers: redactHeaders(headers),
    body: logBody ?? body ?? null,
  });
  const started = Date.now();
  try {
    const res = await fetch(url, { method, headers, body });
    const parsed = await parseBody(res);
    debugLog.log(
      'http',
      res.ok ? 'rx' : 'err',
      `${res.status} ${method} ${url} (${Date.now() - started} ms)`,
      parsed,
    );
    return { res, parsed };
  } catch (e) {
    debugLog.log('http', 'err', `${method} ${url}`, String(e));
    throw new ServiceNowError(`Falha de rede: ${String(e)}`);
  }
}

async function oauthToken(settings: Settings): Promise<string> {
  const key = `${settings.instanceUrl}|${settings.clientId}|${settings.username}`;
  if (
    cachedToken &&
    cachedToken.key === key &&
    cachedToken.expiresAt > Date.now() + 30_000
  ) {
    return cachedToken.accessToken;
  }
  const useRefresh = cachedToken?.key === key && !!cachedToken.refreshToken;
  const form: Record<string, string> = useRefresh
    ? {
        grant_type: 'refresh_token',
        refresh_token: cachedToken!.refreshToken!,
        client_id: settings.clientId,
        client_secret: settings.clientSecret,
      }
    : {
        grant_type: 'password',
        client_id: settings.clientId,
        client_secret: settings.clientSecret,
        username: settings.username,
        password: settings.password,
      };
  const body = Object.entries(form)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  const redacted = {
    ...form,
    client_secret: '***',
    password: form.password ? '***' : undefined,
    refresh_token: form.refresh_token ? '***' : undefined,
  };
  const { res, parsed } = await logged(
    'POST',
    `${baseUrl(settings)}/oauth_token.do`,
    {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body,
    redacted,
  );
  const data = parsed as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
  } | null;
  if (!res.ok || !data?.access_token) {
    cachedToken = null;
    if (useRefresh) {
      return oauthToken(settings);
    }
    throw new ServiceNowError(
      `OAuth falhou (${res.status})`,
      res.status,
      parsed,
    );
  }
  cachedToken = {
    key,
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + (data.expires_in ?? 1800) * 1000,
  };
  return cachedToken.accessToken;
}

async function authHeader(settings: Settings): Promise<string> {
  if (settings.authMode === 'oauth') {
    return `Bearer ${await oauthToken(settings)}`;
  }
  return `Basic ${base64(`${settings.username}:${settings.password}`)}`;
}

async function api<T>(
  settings: Settings,
  method: 'GET' | 'POST',
  path: string,
  payload?: unknown,
): Promise<{ status: number; data: T }> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    Authorization: await authHeader(settings),
  };
  let body: string | undefined;
  if (payload !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(payload);
  }
  const apiPath = settings.apiPath.startsWith('/')
    ? settings.apiPath
    : `/${settings.apiPath}`;
  const { res, parsed } = await logged(
    method,
    `${baseUrl(settings)}${apiPath}${path}`,
    headers,
    body,
    payload,
  );
  if (res.status === 401 && settings.authMode === 'oauth') {
    cachedToken = null;
  }
  if (!res.ok) {
    throw new ServiceNowError(
      errorMessage(parsed, res.status),
      res.status,
      parsed,
    );
  }
  const result = (parsed as { result?: T } | null)?.result ?? (parsed as T);
  return { status: res.status, data: result };
}

type ErrorShape = { message?: string; detail?: string } | string | undefined;

/** Platform errors come as {error:{message}}; NowRFID validation errors as {result:{error:"..."}}. */
function errorMessage(parsed: unknown, status: number): string {
  const body = parsed as {
    error?: ErrorShape;
    result?: { error?: ErrorShape };
  } | null;
  for (const err of [body?.result?.error, body?.error]) {
    if (typeof err === 'string' && err) {
      return err;
    }
    if (err && typeof err === 'object' && (err.message || err.detail)) {
      return (err.message || err.detail)!;
    }
  }
  return `HTTP ${status}`;
}

export interface PingResult {
  ok: boolean;
  user: string;
  scope: string;
  time: string;
}

export interface BatchResult {
  batch_sys_id: string;
  batch_number: string;
  items_created: number;
  errors: { client_item_id: string; message: string }[];
}

function toApiItem(item: ScanItem) {
  return {
    client_item_id: item.id,
    capture_type: item.captureType,
    operation: item.operation,
    epc: item.epc ?? '',
    tid: item.tid ?? '',
    user_data: item.userData ?? '',
    rssi: item.rssi ?? '',
    read_count: item.readCount,
    barcode_value: item.barcodeValue ?? '',
    symbology: item.symbology ?? '',
    captured_at: item.capturedAt,
    raw_payload: JSON.stringify(item.raw),
  };
}

export const serviceNow = {
  ping: (settings: Settings) => api<PingResult>(settings, 'GET', '/ping'),

  sendBatch: (
    settings: Settings,
    batch: ScanBatch,
    device: { deviceId: string; readerMac: string },
  ) =>
    api<BatchResult>(settings, 'POST', '/batch', {
      batch: {
        client_batch_id: batch.id,
        device_id: device.deviceId,
        reader_mac: device.readerMac,
        captured_at: batch.createdAt,
        app_version: APP_VERSION,
        notes: batch.notes,
      },
      items: batch.items.map(toApiItem),
    }),

  resetAuth: () => {
    cachedToken = null;
  },
};
