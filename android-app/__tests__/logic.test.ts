import { mergeItems, tagToItem } from '../src/state/AppState';
import {
  base64,
  generateEpc,
  validateEpc,
  validatePassword,
} from '../src/utils/ids';
import type { ScanItem } from '../src/types';

const tag = (epc: string, count = 1, rssi = '-60') => ({
  epc,
  tid: '',
  user: '',
  pc: '3000',
  rssi,
  antenna: '1',
  count,
  timestamp: 1_700_000_000_000,
});

describe('EPC helpers', () => {
  it('generates a valid 96-bit EPC', () => {
    const epc = generateEpc();
    expect(epc).toHaveLength(24);
    expect(validateEpc(epc)).toBeNull();
  });

  it('rejects non-hex or partial-word EPCs', () => {
    expect(validateEpc('XYZ1')).not.toBeNull();
    expect(validateEpc('ABC')).not.toBeNull();
    expect(validateEpc('')).not.toBeNull();
  });

  it('validates 8-hex access passwords', () => {
    expect(validatePassword('00000000')).toBeNull();
    expect(validatePassword('1234')).not.toBeNull();
    expect(validatePassword('ZZZZZZZZ')).not.toBeNull();
  });
});

describe('base64', () => {
  it('encodes ascii and utf-8 like standard base64', () => {
    const cases: [string, string][] = [
      ['admin:secret', 'YWRtaW46c2VjcmV0'],
      ['usuário:senha çã', 'dXN1w6FyaW86c2VuaGEgw6fDow=='],
      ['a', 'YQ=='],
      ['ab', 'YWI='],
      ['abc', 'YWJj'],
    ];
    for (const [input, expected] of cases) {
      expect(base64(input)).toBe(expected);
    }
  });
});

describe('batch merge', () => {
  it('dedupes repeated RFID reads by EPC and sums read counts', () => {
    let items: ScanItem[] = [];
    items = mergeItems(items, [
      tagToItem(tag('AAAA', 2)),
      tagToItem(tag('BBBB')),
    ]);
    items = mergeItems(items, [tagToItem(tag('AAAA', 3, '-45'))]);
    expect(items).toHaveLength(2);
    const a = items.find(i => i.epc === 'AAAA')!;
    expect(a.readCount).toBe(5);
    expect(a.rssi).toBe('-45');
  });

  it('keeps written tags as separate entries from reads of the same EPC', () => {
    const items = mergeItems(
      [tagToItem(tag('AAAA'))],
      [tagToItem(tag('AAAA'), 'write'), tagToItem(tag('AAAA'), 'write')],
    );
    expect(items.filter(i => i.operation === 'write')).toHaveLength(2);
    expect(items.filter(i => i.operation === 'read')).toHaveLength(1);
  });
});
