import React, { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { useApp } from '../state/AppState';
import {
  Badge,
  Button,
  Card,
  colors,
  Field,
  KeyValue,
  Muted,
  Screen,
  styles,
} from '../ui/components';
import { ItemRow } from './ItemRow';

export function BatchScreen() {
  const {
    batch,
    history,
    settings,
    removeItem,
    setNotes,
    newBatch,
    sendBatch,
  } = useApp();
  const [showHistory, setShowHistory] = useState(false);
  const sending = batch.status === 'sending';
  const reads = batch.items.filter(i => i.operation === 'read').length;
  const writes = batch.items.length - reads;

  const send = async () => {
    if (!settings.instanceUrl) {
      return Alert.alert(
        'Enviar lote',
        'Configure a instância ServiceNow na aba Config.',
      );
    }
    try {
      await sendBatch();
      Alert.alert('Enviar lote', 'Lote enviado ao ServiceNow.');
    } catch (e) {
      Alert.alert(
        'Falha no envio',
        `${
          e instanceof Error ? e.message : String(e)
        }\n\nO lote continua salvo no aparelho — tente novamente.`,
      );
    }
  };

  const discard = () =>
    Alert.alert('Descartar lote', 'Remover todos os itens deste lote?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Descartar', style: 'destructive', onPress: newBatch },
    ]);

  const statusColor = {
    open: colors.primary,
    sending: colors.warning,
    sent: colors.success,
    error: colors.danger,
  }[batch.status];

  return (
    <Screen>
      <Card
        title="Lote atual"
        right={<Badge text={batch.status.toUpperCase()} color={statusColor} />}
      >
        <KeyValue
          k="Criado em"
          v={new Date(batch.createdAt).toLocaleString()}
        />
        <KeyValue
          k="Itens"
          v={`${batch.items.length} (${reads} lidos · ${writes} gravados)`}
        />
        {batch.lastError && (
          <Text style={{ color: colors.danger }}>
            Último erro: {batch.lastError}
          </Text>
        )}
        <Field
          label="Observações do lote"
          value={batch.notes}
          onChangeText={setNotes}
          multiline
        />
        <View style={styles.wrap}>
          <Button
            title="Enviar ao ServiceNow"
            variant="success"
            busy={sending}
            disabled={!batch.items.length}
            onPress={send}
          />
          <Button
            title="Descartar"
            variant="secondary"
            disabled={sending || !batch.items.length}
            onPress={discard}
          />
        </View>
      </Card>

      <Card title="Itens">
        {batch.items.length === 0 && (
          <Muted>Lote vazio. Use as abas Escanear ou Gravar.</Muted>
        )}
        {batch.items.map(item => (
          <ItemRow
            key={item.id}
            item={item}
            onRemove={sending ? undefined : () => removeItem(item.id)}
          />
        ))}
      </Card>

      <Card
        title={`Enviados (${history.length})`}
        right={
          <Button
            title={showHistory ? 'Ocultar' : 'Mostrar'}
            variant="secondary"
            onPress={() => setShowHistory(s => !s)}
          />
        }
      >
        {showHistory &&
          history.map(h => (
            <View
              key={h.id}
              style={[
                styles.row,
                {
                  borderTopWidth: 1,
                  borderTopColor: colors.border,
                  paddingTop: 6,
                },
              ]}
            >
              <View style={styles.flex1}>
                <Text style={styles.text}>
                  {h.serverNumber || h.id.slice(0, 8)}
                </Text>
                <Text style={styles.muted}>
                  {h.sentAt ? new Date(h.sentAt).toLocaleString() : ''}
                </Text>
              </View>
              <Badge text={`${h.items.length} itens`} color={colors.success} />
            </View>
          ))}
      </Card>
    </Screen>
  );
}
