/* eslint-disable no-bitwise -- UUID, EPC and base64 encoding are bit manipulation by nature */
export function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export function isHex(value: string): boolean {
  return /^[0-9a-fA-F]*$/.test(value);
}

/** EPC must be hex and a whole number of 16-bit words (4 hex chars). */
export function validateEpc(epc: string): string | null {
  if (!epc) {
    return 'Informe o EPC';
  }
  if (!isHex(epc)) {
    return 'EPC deve conter apenas hexadecimal (0-9, A-F)';
  }
  if (epc.length % 4 !== 0) {
    return 'EPC deve ter múltiplos de 4 caracteres (words de 16 bits)';
  }
  return null;
}

export function validatePassword(pwd: string): string | null {
  return pwd.length === 8 && isHex(pwd)
    ? null
    : 'Senha deve ter 8 caracteres hexadecimais';
}

/** 96-bit EPC: 4-hex prefix + 12 hex of time + 8 random hex. */
export function generateEpc(prefix = 'E280'): string {
  const time = Date.now()
    .toString(16)
    .toUpperCase()
    .padStart(12, '0')
    .slice(-12);
  const random = Math.floor(Math.random() * 0xffffffff)
    .toString(16)
    .toUpperCase()
    .padStart(8, '0');
  return (prefix.toUpperCase() + time + random).slice(0, 24);
}

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function utf8Bytes(input: string): number[] {
  const bytes: number[] = [];
  for (const ch of input) {
    const cp = ch.codePointAt(0) ?? 0;
    if (cp < 0x80) {
      bytes.push(cp);
    } else if (cp < 0x800) {
      bytes.push(0xc0 | (cp >> 6), 0x80 | (cp & 63));
    } else if (cp < 0x10000) {
      bytes.push(0xe0 | (cp >> 12), 0x80 | ((cp >> 6) & 63), 0x80 | (cp & 63));
    } else {
      bytes.push(
        0xf0 | (cp >> 18),
        0x80 | ((cp >> 12) & 63),
        0x80 | ((cp >> 6) & 63),
        0x80 | (cp & 63),
      );
    }
  }
  return bytes;
}

export function base64(input: string): string {
  const bytes = utf8Bytes(input);
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const n =
      (bytes[i] << 16) | ((bytes[i + 1] ?? 0) << 8) | (bytes[i + 2] ?? 0);
    out += B64[(n >> 18) & 63] + B64[(n >> 12) & 63];
    out += i + 1 < bytes.length ? B64[(n >> 6) & 63] : '=';
    out += i + 2 < bytes.length ? B64[n & 63] : '=';
  }
  return out;
}
