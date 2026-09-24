import React, { useEffect, useState } from 'react';
import { Alert, Text } from 'react-native';
import { Bank, LockBank, LockMode, reader, TagRead } from '../reader/chainway';
import { tagToItem, useApp } from '../state/AppState';
import {
  Button,
  Card,
  colors,
  Field,
  KeyValue,
  Muted,
  Screen,
  styles,
  Toggle,
} from '../ui/components';
import {
  generateEpc,
  isHex,
  validateEpc,
  validatePassword,
} from '../utils/ids';

/** "Tag sendo criada": read the target tag, write a new EPC (and optional USER data), verify, add to batch. */
export function WriteScreen() {
  const { connection, addItems } = useApp();
  const connected = connection.status === 'connected';
  const [target, setTarget] = useState<TagRead | null>(null);
  const [newEpc, setNewEpc] = useState('');
  const [assetRef, setAssetRef] = useState('');
  const [password, setPassword] = useState('00000000');
  const [writeUser, setWriteUser] = useState(false);
  const [userData, setUserData] = useState('');
  const [lockAfter, setLockAfter] = useState(false);
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  const note = (line: string) => setLog(prev => [...prev, line]);

  const readTarget = async () => {
    setBusy(true);
    try {
      const tag = await reader.inventorySingle();
      if (tag?.epc) {
        setTarget(tag);
        setLog([`Tag alvo: ${tag.epc}`]);
      } else {
        Alert.alert(
          'Gravar tag',
          'Nenhuma tag encontrada. Aproxime apenas a tag que deseja gravar.',
        );
      }
    } catch (e) {
      Alert.alert('Gravar tag', String(e));
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    const sub = reader.onTrigger(evt => {
      if (evt.action === 'down' && !busy && connected) {
        readTarget();
      }
    });
    return () => sub.remove();
  }, [busy, connected]);

  const write = async () => {
    const epc = newEpc.trim().toUpperCase();
    const problem =
      (!target && 'Leia a tag alvo primeiro') ||
      validateEpc(epc) ||
      validatePassword(password) ||
      (writeUser &&
        (!userData || !isHex(userData) || userData.length % 4 !== 0) &&
        'Dados USER devem ser hex em múltiplos de 4 caracteres');
    if (problem) {
      Alert.alert('Gravar tag', problem);
      return;
    }
    setBusy(true);
    setLog([`Gravando EPC ${epc} sobre ${target!.epc}...`]);
    try {
      if (!(await reader.writeEpc(password, epc, target!.epc))) {
        throw new Error(
          'O leitor retornou falha ao gravar o EPC (tag fora de alcance, travada ou senha incorreta).',
        );
      }
      note('EPC gravado.');

      const readBack = await reader
        .readData(password, Bank.EPC, 2, epc.length / 4, epc)
        .catch(() => '');
      const verified = readBack.toUpperCase() === epc;
      note(
        verified
          ? 'Verificação por releitura: OK.'
          : `Releitura não confirmou (lido: ${readBack || 'nada'}).`,
      );

      if (writeUser) {
        const data = userData.toUpperCase();
        const ok = await reader.writeData(
          password,
          Bank.USER,
          0,
          data.length / 4,
          data,
          epc,
        );
        note(ok ? 'USER bank gravado.' : 'Falha ao gravar USER bank.');
      }

      if (lockAfter) {
        const ok = await reader.lockTag(
          password,
          [LockBank.EPC],
          LockMode.LOCK,
          epc,
        );
        note(ok ? 'EPC travado (lock).' : 'Falha ao travar EPC.');
      }

      addItems([
        tagToItem(
          {
            ...target!,
            epc,
            user: writeUser ? userData.toUpperCase() : target!.user,
            count: 1,
            timestamp: Date.now(),
          },
          'write',
          {
            previousEpc: target!.epc,
            assetRef,
            verified,
            locked: lockAfter,
          },
        ),
      ]);
      note('Adicionada ao lote como GRAVADA.');
      setTarget(null);
      setNewEpc('');
      setAssetRef('');
    } catch (e) {
      note(`Erro: ${e instanceof Error ? e.message : String(e)}`);
      Alert.alert('Gravar tag', e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      {!connected && (
        <Card>
          <Text style={[styles.text, { color: colors.warning }]}>
            Conecte o leitor R6 para gravar tags.
          </Text>
        </Card>
      )}
      <Card title="1. Tag alvo">
        <Muted>
          Deixe apenas a tag a ser gravada próxima ao leitor e faça uma leitura
          única (botão ou gatilho).
        </Muted>
        <KeyValue k="EPC atual" v={target?.epc} />
        <KeyValue k="TID" v={target?.tid} />
        <Button
          title="Ler tag alvo"
          disabled={!connected}
          busy={busy && !target}
          onPress={readTarget}
        />
      </Card>

      <Card title="2. Nova identidade">
        <Field
          label="Novo EPC (hex)"
          value={newEpc}
          onChangeText={t => setNewEpc(t.replace(/\s/g, ''))}
          autoCapitalize="characters"
        />
        <Button
          title="Gerar EPC (96 bits)"
          variant="secondary"
          onPress={() => setNewEpc(generateEpc())}
        />
        <Field
          label="Referência do ativo (asset tag / serial) — vai junto no lote"
          value={assetRef}
          onChangeText={setAssetRef}
        />
        <Field
          label="Senha de acesso (8 hex)"
          value={password}
          onChangeText={setPassword}
          autoCapitalize="characters"
          maxLength={8}
        />
        <Toggle
          label="Gravar também USER bank"
          value={writeUser}
          onChange={setWriteUser}
        />
        {writeUser && (
          <Field
            label="Dados USER (hex)"
            value={userData}
            onChangeText={setUserData}
            autoCapitalize="characters"
          />
        )}
        <Toggle
          label="Travar EPC após gravar (lock)"
          value={lockAfter}
          onChange={setLockAfter}
        />
        {lockAfter && (
          <Muted>
            Com a senha padrão 00000000 o lock não protege de fato. Defina uma
            senha de acesso antes (aba Ferramentas).
          </Muted>
        )}
        <Button
          title="Gravar tag"
          variant="success"
          disabled={!connected || !target}
          busy={busy && !!target}
          onPress={write}
        />
      </Card>

      {log.length > 0 && (
        <Card title="Resultado">
          {log.map((l, i) => (
            <Text key={i} style={styles.text}>
              {l}
            </Text>
          ))}
        </Card>
      )}
    </Screen>
  );
}
