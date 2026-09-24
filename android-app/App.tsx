import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { installReaderDebugTap } from './src/reader/chainway';
import { BatchScreen } from './src/screens/BatchScreen';
import { ConnectScreen } from './src/screens/ConnectScreen';
import { DebugScreen } from './src/screens/DebugScreen';
import { ScanScreen } from './src/screens/ScanScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { ToolsScreen } from './src/screens/ToolsScreen';
import { WriteScreen } from './src/screens/WriteScreen';
import { AppStateProvider, useApp } from './src/state/AppState';
import { colors } from './src/ui/components';

installReaderDebugTap();

type Tab =
  | 'connect'
  | 'scan'
  | 'write'
  | 'tools'
  | 'batch'
  | 'settings'
  | 'debug';

const TABS: { key: Tab; label: string; Screen: React.ComponentType }[] = [
  { key: 'connect', label: 'Conectar', Screen: ConnectScreen },
  { key: 'scan', label: 'Escanear', Screen: ScanScreen },
  { key: 'write', label: 'Gravar', Screen: WriteScreen },
  { key: 'tools', label: 'Ferram.', Screen: ToolsScreen },
  { key: 'batch', label: 'Lote', Screen: BatchScreen },
  { key: 'settings', label: 'Config', Screen: SettingsScreen },
  { key: 'debug', label: 'Debug', Screen: DebugScreen },
];

function Shell() {
  const { ready, settings, connection, batch } = useApp();
  const [tab, setTab] = useState<Tab>('connect');
  const tabs = TABS.filter(t => t.key !== 'debug' || settings.debugEnabled);

  useEffect(() => {
    if (tab === 'debug' && !settings.debugEnabled) {
      setTab('settings');
    }
  }, [tab, settings.debugEnabled]);

  if (!ready) {
    return <ActivityIndicator style={styles.flex} />;
  }
  const Active = TABS.find(t => t.key === tab)!.Screen;
  const dot =
    connection.status === 'connected'
      ? colors.success
      : connection.status === 'connecting'
      ? colors.warning
      : colors.danger;

  return (
    <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>NowRFID</Text>
        <View style={styles.headerRight}>
          <Text style={styles.headerText}>{batch.items.length} no lote</Text>
          <View style={[styles.dot, { backgroundColor: dot }]} />
        </View>
      </View>
      <View style={styles.flex}>
        <Active />
      </View>
      <View style={styles.tabBar}>
        {tabs.map(t => (
          <Pressable
            key={t.key}
            onPress={() => setTab(t.key)}
            style={[styles.tab, tab === t.key && styles.tabActive]}
          >
            <Text
              style={[styles.tabText, tab === t.key && styles.tabTextActive]}
              numberOfLines={1}
            >
              {t.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" />
      <AppStateProvider>
        <Shell />
      </AppStateProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.dark,
  },
  headerTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerText: { color: '#C9D1D9', fontSize: 13 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: {
    borderTopWidth: 3,
    borderTopColor: colors.primary,
    paddingTop: 9,
  },
  tabText: { fontSize: 11, color: colors.muted, fontWeight: '600' },
  tabTextActive: { color: colors.primary },
});
