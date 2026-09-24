import React, { useMemo, useState } from 'react';
import { FlatList, Share, StyleSheet, Text, View } from 'react-native';
import {
  debugLog,
  DebugEntry,
  DebugSource,
  useDebugEntries,
} from '../debug/debugLog';
import { Button, colors, Segmented } from '../ui/components';

type Filter = 'all' | DebugSource;

const DIRECTION_COLOR: Record<DebugEntry['direction'], string> = {
  tx: '#58A6FF',
  rx: '#3FB950',
  err: '#F85149',
  info: '#D29922',
};

function time(ts: number): string {
  const d = new Date(ts);
  return `${d.toLocaleTimeString()}.${String(d.getMilliseconds()).padStart(
    3,
    '0',
  )}`;
}

export function DebugScreen() {
  const entries = useDebugEntries();
  const [filter, setFilter] = useState<Filter>('all');
  const [expanded, setExpanded] = useState<number | null>(null);
  const visible = useMemo(
    () =>
      filter === 'all' ? entries : entries.filter(e => e.source === filter),
    [entries, filter],
  );

  return (
    <View style={s.container}>
      <View style={s.toolbar}>
        <Segmented<Filter>
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: `Tudo (${entries.length})` },
            { value: 'reader', label: 'Leitor' },
            { value: 'http', label: 'ServiceNow' },
            { value: 'app', label: 'App' },
          ]}
        />
        <View style={s.actions}>
          <Button title="Limpar" variant="secondary" onPress={debugLog.clear} />
          <Button
            title="Compartilhar log"
            variant="secondary"
            onPress={() =>
              Share.share({ message: debugLog.exportText(visible) })
            }
          />
        </View>
      </View>
      <FlatList
        data={visible}
        keyExtractor={e => String(e.id)}
        initialNumToRender={30}
        renderItem={({ item }) => (
          <Text
            style={s.line}
            onPress={() => setExpanded(expanded === item.id ? null : item.id)}
          >
            <Text style={s.time}>{time(item.ts)} </Text>
            <Text style={{ color: DIRECTION_COLOR[item.direction] }}>
              {item.direction.toUpperCase()}{' '}
            </Text>
            <Text style={s.source}>[{item.source}] </Text>
            <Text style={s.title}>{item.title}</Text>
            {!!item.detail && (
              <Text
                style={s.detail}
                numberOfLines={expanded === item.id ? undefined : 3}
              >
                {'\n'}
                {item.detail}
              </Text>
            )}
          </Text>
        )}
        ListEmptyComponent={
          <Text style={s.empty}>
            Nada transmitido ainda. Conecte o leitor, escaneie ou envie um lote.
          </Text>
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.dark },
  toolbar: { padding: 10, gap: 8, backgroundColor: '#161B22' },
  actions: { flexDirection: 'row', gap: 8 },
  line: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#C9D1D9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#21262D',
  },
  time: { color: '#8B949E' },
  source: { color: '#BC8CFF' },
  title: { color: '#E6EDF3', fontWeight: '700' },
  detail: { color: '#A5B3C2' },
  empty: { color: '#8B949E', padding: 16, textAlign: 'center' },
});
