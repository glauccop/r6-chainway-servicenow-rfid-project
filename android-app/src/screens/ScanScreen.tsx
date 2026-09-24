import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { reader } from '../reader/chainway';
import { barcodeToItem, tagToItem, useApp } from '../state/AppState';
import {
  Badge,
  Button,
  Card,
  colors,
  Muted,
  Screen,
  Segmented,
  styles,
} from '../ui/components';
import { ItemRow } from './ItemRow';

type Mode = 'rfid' | 'barcode';

export function ScanScreen() {
  const { connection, batch, addItems } = useApp();
  const [mode, setMode] = useState<Mode>('rfid');
  const [inventorying, setInventorying] = useState(false);
  const [scanningCode, setScanningCode] = useState(false);
  const inventoryRef = useRef(false);
  const connected = connection.status === 'connected';

  const startInventory = useCallback(async () => {
    try {
      if (await reader.startInventory()) {
        inventoryRef.current = true;
        setInventorying(true);
      } else {
        Alert.alert('Leitura RFID', 'O leitor recusou iniciar o inventário.');
      }
    } catch (e) {
      Alert.alert('Leitura RFID', String(e));
    }
  }, []);

  const stopInventory = useCallback(async () => {
    inventoryRef.current = false;
    setInventorying(false);
    await reader.stopInventory().catch(() => undefined);
  }, []);

  const readSingle = async () => {
    try {
      const tag = await reader.inventorySingle();
      if (tag?.epc) {
        addItems([tagToItem(tag)]);
      } else {
        Alert.alert('Leitura única', 'Nenhuma tag encontrada.');
      }
    } catch (e) {
      Alert.alert('Leitura única', String(e));
    }
  };

  const scanCode = useCallback(async () => {
    setScanningCode(true);
    try {
      const code = await reader.scanBarcode();
      if (code?.value) {
        addItems([barcodeToItem(code)]);
      }
    } catch (e) {
      Alert.alert('Código de barras/QR', String(e));
    } finally {
      setScanningCode(false);
    }
  }, [addItems]);

  useEffect(() => {
    const tags = reader.onTags(list =>
      addItems(list.filter(t => t.epc).map(t => tagToItem(t))),
    );
    return () => {
      tags.remove();
      if (inventoryRef.current) {
        reader.stopInventory().catch(() => undefined);
      }
    };
  }, [addItems]);

  // Physical trigger on the R6: RFID mode toggles inventory, barcode mode fires the imager.
  useEffect(() => {
    const sub = reader.onTrigger(evt => {
      if (evt.action !== 'down') {
        return;
      }
      if (mode === 'rfid') {
        inventoryRef.current ? stopInventory() : startInventory();
      } else if (!scanningCode) {
        scanCode();
      }
    });
    return () => sub.remove();
  }, [mode, scanningCode, startInventory, stopInventory, scanCode]);

  const changeMode = (m: Mode) => {
    if (inventoryRef.current) {
      stopInventory();
    }
    setMode(m);
  };

  const rfidCount = batch.items.filter(i => i.captureType === 'rfid').length;
  const codeCount = batch.items.length - rfidCount;
  const recent = [...batch.items].reverse().slice(0, 50);

  return (
    <Screen>
      {!connected && (
        <Card>
          <Text style={[styles.text, { color: colors.warning }]}>
            Conecte o leitor R6 na aba "Conectar" para escanear.
          </Text>
        </Card>
      )}
      <Card title="Escanear ativos">
        <Segmented
          value={mode}
          onChange={changeMode}
          options={[
            { value: 'rfid', label: 'RFID UHF' },
            { value: 'barcode', label: 'Barcode / QR' },
          ]}
        />
        {mode === 'rfid' ? (
          <View style={styles.wrap}>
            <Button
              title={
                inventorying ? 'Parar leitura' : 'Iniciar leitura contínua'
              }
              variant={inventorying ? 'danger' : 'primary'}
              disabled={!connected}
              onPress={inventorying ? stopInventory : startInventory}
            />
            <Button
              title="Leitura única"
              variant="secondary"
              disabled={!connected || inventorying}
              onPress={readSingle}
            />
          </View>
        ) : (
          <View style={styles.wrap}>
            <Button
              title="Ler código"
              disabled={!connected}
              busy={scanningCode}
              onPress={scanCode}
            />
            {scanningCode && (
              <Button
                title="Cancelar"
                variant="secondary"
                onPress={() => reader.stopBarcode()}
              />
            )}
          </View>
        )}
        <Muted>
          O gatilho físico do R6 também dispara a leitura no modo selecionado.
        </Muted>
      </Card>

      <Card
        title="Lote atual"
        right={<Badge text={`${rfidCount} RFID · ${codeCount} códigos`} />}
      >
        {recent.length === 0 && <Muted>Nenhum item lido ainda.</Muted>}
        {recent.map(item => (
          <ItemRow key={item.id} item={item} />
        ))}
        {batch.items.length > recent.length && (
          <Muted>
            … e mais {batch.items.length - recent.length} itens (veja a aba
            Lote).
          </Muted>
        )}
      </Card>
    </Screen>
  );
}
