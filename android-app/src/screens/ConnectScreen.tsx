import React, { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { DeviceFound, frequencyLabel, reader } from '../reader/chainway';
import { requestBlePermissions } from '../reader/permissions';
import { useApp } from '../state/AppState';
import {
  Badge,
  Button,
  Card,
  colors,
  KeyValue,
  Muted,
  Screen,
  styles,
} from '../ui/components';

const SCAN_MS = 10_000;

export function ConnectScreen() {
  const {
    connection,
    readerInfo,
    settings,
    updateSettings,
    refreshReaderInfo,
  } = useApp();
  const [devices, setDevices] = useState<DeviceFound[]>([]);
  const [scanning, setScanning] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const sub = reader.onDeviceFound(d =>
      setDevices(prev => {
        const rest = prev.filter(p => p.address !== d.address);
        return [...rest, d].sort((a, b) => b.rssi - a.rssi);
      }),
    );
    return () => {
      sub.remove();
      if (timer.current) {
        clearTimeout(timer.current);
      }
      reader.stopScanDevices();
    };
  }, []);

  const stopScan = () => {
    if (timer.current) {
      clearTimeout(timer.current);
    }
    reader.stopScanDevices();
    setScanning(false);
  };

  const startScan = async () => {
    if (!(await requestBlePermissions())) {
      Alert.alert(
        'Permissões',
        'Conceda Bluetooth e Localização para buscar o leitor R6.',
      );
      return;
    }
    setDevices([]);
    setScanning(true);
    reader.startScanDevices();
    timer.current = setTimeout(stopScan, SCAN_MS);
  };

  const connect = async (address: string, name: string) => {
    if (!(await requestBlePermissions())) {
      Alert.alert(
        'Permissões',
        'Conceda Bluetooth e Localização para conectar ao leitor.',
      );
      return;
    }
    stopScan();
    updateSettings({ lastDeviceAddress: address, lastDeviceName: name });
    reader.connect(address);
  };

  const connected = connection.status === 'connected';
  const statusColor = connected
    ? colors.success
    : connection.status === 'connecting'
    ? colors.warning
    : colors.muted;

  return (
    <Screen>
      <Card
        title="Leitor Chainway R6"
        right={
          <Badge text={connection.status.toUpperCase()} color={statusColor} />
        }
      >
        <KeyValue k="Dispositivo" v={settings.lastDeviceName || '-'} />
        <KeyValue
          k="MAC"
          v={connection.address || settings.lastDeviceAddress}
        />
        <View style={styles.wrap}>
          {connected ? (
            <Button
              title="Desconectar"
              variant="danger"
              onPress={() => reader.disconnect()}
            />
          ) : (
            <Button
              title="Reconectar último"
              disabled={
                !settings.lastDeviceAddress ||
                connection.status === 'connecting'
              }
              onPress={() =>
                connect(settings.lastDeviceAddress, settings.lastDeviceName)
              }
            />
          )}
          {connected && (
            <Button
              title="Atualizar info"
              variant="secondary"
              onPress={refreshReaderInfo}
            />
          )}
        </View>
      </Card>

      {connected && (
        <Card title="Status do leitor">
          <KeyValue
            k="Bateria"
            v={
              readerInfo.battery !== undefined
                ? `${readerInfo.battery}%`
                : undefined
            }
          />
          <KeyValue k="Versão UHF" v={readerInfo.version} />
          <KeyValue k="Hardware BLE" v={readerInfo.bleHardwareVersion} />
          <KeyValue
            k="Temperatura"
            v={
              readerInfo.temperature !== undefined
                ? `${readerInfo.temperature} °C`
                : undefined
            }
          />
          <KeyValue
            k="Potência"
            v={
              readerInfo.power !== undefined
                ? `${readerInfo.power} dBm`
                : undefined
            }
          />
          <KeyValue k="Região" v={frequencyLabel(readerInfo.frequencyMode)} />
        </Card>
      )}

      <Card
        title="Buscar leitores (BLE)"
        right={
          <Button
            title={scanning ? 'Parar' : 'Buscar'}
            variant={scanning ? 'secondary' : 'primary'}
            onPress={scanning ? stopScan : startScan}
          />
        }
      >
        <Muted>
          O R6 aparece como "Nordic_UART_CW" (ou nome customizado). Ligue o
          leitor antes de buscar.
        </Muted>
        {devices.length === 0 && (
          <Muted>
            {scanning ? 'Buscando...' : 'Nenhum dispositivo encontrado.'}
          </Muted>
        )}
        {devices.map(d => (
          <Pressable
            key={d.address}
            onPress={() => connect(d.address, d.name)}
            style={[styles.card, styles.row]}
          >
            <View style={styles.flex1}>
              <Text style={styles.text}>{d.name || '(sem nome)'}</Text>
              <Text style={styles.muted}>{d.address}</Text>
            </View>
            <Badge
              text={`${d.rssi} dBm`}
              color={/uart|r6/i.test(d.name) ? colors.success : colors.muted}
            />
          </Pressable>
        ))}
      </Card>
    </Screen>
  );
}
