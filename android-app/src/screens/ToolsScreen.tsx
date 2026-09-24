import React, { useEffect, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import {
  Bank,
  FREQUENCY_MODES,
  frequencyLabel,
  LockBank,
  LockMode,
  reader,
} from '../reader/chainway';
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
  Segmented,
  styles,
  Toggle,
} from '../ui/components';
import { isHex, validateEpc, validatePassword } from '../utils/ids';

type Tool = 'memory' | 'lock' | 'kill' | 'locate' | 'config';

const BANK_OPTIONS = [
  { value: Bank.RESERVED, label: 'RESERVED' },
  { value: Bank.EPC, label: 'EPC' },
  { value: Bank.TID, label: 'TID' },
  { value: Bank.USER, label: 'USER' },
];

function confirm(title: string, message: string): Promise<boolean> {
  return new Promise(resolve =>
    Alert.alert(title, message, [
      { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
      { text: 'Confirmar', style: 'destructive', onPress: () => resolve(true) },
    ]),
  );
}

function checkFilter(filterEpc: string): string | null {
  return filterEpc ? validateEpc(filterEpc) : null;
}

export function ToolsScreen() {
  const { connection } = useApp();
  const [tool, setTool] = useState<Tool>('memory');
  const connected = connection.status === 'connected';

  return (
    <Screen>
      {!connected && (
        <Card>
          <Text style={[styles.text, { color: colors.warning }]}>
            Conecte o leitor R6 para usar as ferramentas.
          </Text>
        </Card>
      )}
      <Segmented
        value={tool}
        onChange={setTool}
        options={[
          { value: 'memory', label: 'Memória' },
          { value: 'lock', label: 'Lock' },
          { value: 'kill', label: 'Kill' },
          { value: 'locate', label: 'Localizar' },
          { value: 'config', label: 'Config RF' },
        ]}
      />
      {tool === 'memory' && <MemoryTool connected={connected} />}
      {tool === 'lock' && <LockTool connected={connected} />}
      {tool === 'kill' && <KillTool connected={connected} />}
      {tool === 'locate' && <LocateTool connected={connected} />}
      {tool === 'config' && <ConfigTool connected={connected} />}
    </Screen>
  );
}

function FilterField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Field
      label="Filtrar pelo EPC (opcional — recomendado com várias tags por perto)"
      value={value}
      onChangeText={t => onChange(t.replace(/\s/g, '').toUpperCase())}
      autoCapitalize="characters"
    />
  );
}

function MemoryTool({ connected }: { connected: boolean }) {
  const [bank, setBank] = useState<number>(Bank.USER);
  const [ptr, setPtr] = useState('0');
  const [cnt, setCnt] = useState('4');
  const [pwd, setPwd] = useState('00000000');
  const [data, setData] = useState('');
  const [filter, setFilter] = useState('');
  const [result, setResult] = useState('');
  const [busy, setBusy] = useState(false);

  const params = () => {
    const p = Number(ptr);
    const c = Number(cnt);
    const problem =
      validatePassword(pwd) ||
      checkFilter(filter) ||
      (!(p >= 0) || !(c > 0) ? 'Ptr/Len inválidos (em words)' : null);
    return { p, c, problem };
  };

  const doRead = async () => {
    const { p, c, problem } = params();
    if (problem) {
      return Alert.alert('Memória', problem);
    }
    setBusy(true);
    try {
      const value = await reader.readData(pwd, bank, p, c, filter);
      setResult(value);
      setData(value);
    } catch (e) {
      setResult(`Erro: ${String(e)}`);
    } finally {
      setBusy(false);
    }
  };

  const doWrite = async () => {
    const { p, c, problem } = params();
    const hex = data.toUpperCase();
    const dataProblem =
      !hex || !isHex(hex) || hex.length !== c * 4
        ? `Dados devem ter exatamente ${c * 4} hex (Len × 4)`
        : null;
    if (problem || dataProblem) {
      return Alert.alert('Memória', (problem || dataProblem)!);
    }
    if (bank === Bank.TID) {
      return Alert.alert('Memória', 'O banco TID é somente leitura.');
    }
    if (
      bank === Bank.RESERVED &&
      !(await confirm(
        'Gravar RESERVED',
        'Isto altera as senhas de kill/acesso da tag. Continuar?',
      ))
    ) {
      return;
    }
    setBusy(true);
    try {
      const ok = await reader.writeData(pwd, bank, p, c, hex, filter);
      setResult(ok ? 'Gravação OK' : 'Falha na gravação');
    } catch (e) {
      setResult(`Erro: ${String(e)}`);
    } finally {
      setBusy(false);
    }
  };

  const doErase = async () => {
    const { p, c, problem } = params();
    if (problem) {
      return Alert.alert('Memória', problem);
    }
    if (
      !(await confirm(
        'Apagar dados',
        `Zerar ${c} word(s) a partir de ${p} no banco selecionado?`,
      ))
    ) {
      return;
    }
    setBusy(true);
    try {
      setResult(
        (await reader.eraseData(pwd, bank, p, c, filter))
          ? 'Apagado'
          : 'Falha ao apagar',
      );
    } catch (e) {
      setResult(`Erro: ${String(e)}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card title="Ler / Gravar / Apagar memória da tag">
      <Segmented options={BANK_OPTIONS} value={bank} onChange={setBank} />
      <View style={styles.row}>
        <View style={styles.flex1}>
          <Field
            label="Ptr (word)"
            value={ptr}
            onChangeText={setPtr}
            keyboardType="number-pad"
          />
        </View>
        <View style={styles.flex1}>
          <Field
            label="Len (words)"
            value={cnt}
            onChangeText={setCnt}
            keyboardType="number-pad"
          />
        </View>
      </View>
      <Field
        label="Senha de acesso"
        value={pwd}
        onChangeText={setPwd}
        maxLength={8}
        autoCapitalize="characters"
      />
      <FilterField value={filter} onChange={setFilter} />
      <Field
        label="Dados (hex)"
        value={data}
        onChangeText={t => setData(t.replace(/\s/g, ''))}
        autoCapitalize="characters"
        multiline
      />
      <View style={styles.wrap}>
        <Button
          title="Ler"
          disabled={!connected}
          busy={busy}
          onPress={doRead}
        />
        <Button
          title="Gravar"
          variant="success"
          disabled={!connected || busy}
          onPress={doWrite}
        />
        <Button
          title="Apagar"
          variant="danger"
          disabled={!connected || busy}
          onPress={doErase}
        />
      </View>
      <Muted>
        EPC: dados começam na word 2 (words 0-1 são CRC e PC). RESERVED: word
        0-1 = kill pwd, 2-3 = access pwd.
      </Muted>
      {!!result && <KeyValue k="Resultado" v={result} />}
    </Card>
  );
}

const LOCK_BANKS = [
  { value: LockBank.EPC, label: 'EPC' },
  { value: LockBank.USER, label: 'USER' },
  { value: LockBank.TID, label: 'TID' },
  { value: LockBank.ACCESS, label: 'Access pwd' },
  { value: LockBank.KILL, label: 'Kill pwd' },
];

const LOCK_MODES = [
  { value: LockMode.LOCK, label: 'Lock' },
  { value: LockMode.OPEN, label: 'Unlock' },
  { value: LockMode.PERMA_LOCK, label: 'Perma-lock' },
  { value: LockMode.PERMA_OPEN, label: 'Perma-unlock' },
];

function LockTool({ connected }: { connected: boolean }) {
  const [banks, setBanks] = useState<number[]>([LockBank.EPC]);
  const [mode, setMode] = useState<number>(LockMode.LOCK);
  const [pwd, setPwd] = useState('');
  const [filter, setFilter] = useState('');
  const [result, setResult] = useState('');

  const toggleBank = (b: number) =>
    setBanks(prev =>
      prev.includes(b) ? prev.filter(x => x !== b) : [...prev, b],
    );

  const run = async () => {
    const problem =
      validatePassword(pwd) ||
      checkFilter(filter) ||
      (banks.length === 0 ? 'Selecione ao menos um banco' : null);
    if (problem) {
      return Alert.alert('Lock', problem);
    }
    const permanent =
      mode === LockMode.PERMA_LOCK || mode === LockMode.PERMA_OPEN;
    if (
      permanent &&
      !(await confirm(
        'Operação PERMANENTE',
        'Perma-lock/unlock não pode ser desfeito. Continuar?',
      ))
    ) {
      return;
    }
    try {
      setResult(
        (await reader.lockTag(pwd, banks, mode, filter))
          ? 'Lock aplicado'
          : 'Falha no lock',
      );
    } catch (e) {
      setResult(`Erro: ${String(e)}`);
    }
  };

  return (
    <Card title="Lock / Unlock">
      <Muted>Bancos:</Muted>
      <View style={styles.wrap}>
        {LOCK_BANKS.map(b => (
          <Pressable key={b.value} onPress={() => toggleBank(b.value)}>
            <Badge
              text={b.label}
              color={banks.includes(b.value) ? colors.primary : colors.muted}
            />
          </Pressable>
        ))}
      </View>
      <Segmented options={LOCK_MODES} value={mode} onChange={setMode} />
      <Field
        label="Senha de acesso (não pode ser 00000000)"
        value={pwd}
        onChangeText={setPwd}
        maxLength={8}
        autoCapitalize="characters"
      />
      <FilterField value={filter} onChange={setFilter} />
      <Button
        title="Aplicar"
        variant="danger"
        disabled={!connected}
        onPress={run}
      />
      {!!result && <KeyValue k="Resultado" v={result} />}
    </Card>
  );
}

function KillTool({ connected }: { connected: boolean }) {
  const [pwd, setPwd] = useState('');
  const [filter, setFilter] = useState('');
  const [result, setResult] = useState('');

  const run = async () => {
    const problem =
      validatePassword(pwd) ||
      (pwd === '00000000' ? 'A senha de kill não pode ser 00000000' : null) ||
      validateEpc(filter);
    if (problem) {
      return Alert.alert('Kill', problem);
    }
    if (
      !(await confirm(
        'Destruir tag',
        `A tag ${filter} ficará PERMANENTEMENTE inutilizada. Continuar?`,
      ))
    ) {
      return;
    }
    try {
      setResult(
        (await reader.killTag(pwd, filter)) ? 'Tag destruída' : 'Falha no kill',
      );
    } catch (e) {
      setResult(`Erro: ${String(e)}`);
    }
  };

  return (
    <Card title="Kill (destruir tag)">
      <Muted>
        Exige a senha de kill gravada no banco RESERVED e o EPC da tag alvo
        (obrigatório aqui, por segurança).
      </Muted>
      <Field
        label="Senha de kill"
        value={pwd}
        onChangeText={setPwd}
        maxLength={8}
        autoCapitalize="characters"
      />
      <FilterField value={filter} onChange={setFilter} />
      <Button
        title="Destruir tag"
        variant="danger"
        disabled={!connected}
        onPress={run}
      />
      {!!result && <KeyValue k="Resultado" v={result} />}
    </Card>
  );
}

function LocateTool({ connected }: { connected: boolean }) {
  const [epc, setEpc] = useState('');
  const [active, setActive] = useState(false);
  const [value, setValue] = useState(0);

  useEffect(() => {
    const sub = reader.onLocate(evt => evt.valid && setValue(evt.value));
    return () => {
      sub.remove();
      reader.stopLocate().catch(() => undefined);
    };
  }, []);

  const toggle = async () => {
    if (active) {
      await reader.stopLocate().catch(() => undefined);
      setActive(false);
      return;
    }
    const problem = validateEpc(epc);
    if (problem) {
      return Alert.alert('Localizar', problem);
    }
    setValue(0);
    if (await reader.startLocate(epc).catch(() => false)) {
      setActive(true);
    } else {
      Alert.alert('Localizar', 'O leitor não iniciou a localização.');
    }
  };

  return (
    <Card title="Localizar tag (detector de proximidade)">
      <Field
        label="EPC da tag procurada"
        value={epc}
        onChangeText={t => setEpc(t.replace(/\s/g, '').toUpperCase())}
        autoCapitalize="characters"
      />
      <Button
        title={active ? 'Parar' : 'Iniciar busca'}
        variant={active ? 'danger' : 'primary'}
        disabled={!connected}
        onPress={toggle}
      />
      <View
        style={{
          height: 22,
          backgroundColor: '#E7ECF3',
          borderRadius: 11,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            width: `${value}%`,
            height: '100%',
            backgroundColor:
              value > 70
                ? colors.success
                : value > 35
                ? colors.warning
                : colors.primary,
          }}
        />
      </View>
      <Muted>Proximidade: {value}/100 — quanto maior, mais perto.</Muted>
    </Card>
  );
}

function ConfigTool({ connected }: { connected: boolean }) {
  const { settings, updateSettings, readerInfo, refreshReaderInfo } = useApp();
  const [power, setPower] = useState(readerInfo.power ?? 30);
  const [beep, setBeep] = useState(true);

  useEffect(() => {
    if (readerInfo.power !== undefined) {
      setPower(readerInfo.power);
    }
  }, [readerInfo.power]);

  const apply = async (label: string, action: () => Promise<boolean>) => {
    try {
      const ok = await action();
      Alert.alert(label, ok ? 'Aplicado' : 'O leitor recusou a configuração');
      refreshReaderInfo();
    } catch (e) {
      Alert.alert(label, String(e));
    }
  };

  return (
    <>
      <Card title="Potência de saída">
        <View style={styles.row}>
          <Button
            title="−"
            variant="secondary"
            onPress={() => setPower(p => Math.max(5, p - 1))}
          />
          <Text style={[styles.cardTitle, { fontSize: 22 }]}>{power} dBm</Text>
          <Button
            title="+"
            variant="secondary"
            onPress={() => setPower(p => Math.min(30, p + 1))}
          />
        </View>
        <Muted>
          5–30 dBm. Menos potência = leitura mais seletiva (útil para gravar uma
          tag entre várias).
        </Muted>
        <Button
          title="Aplicar potência"
          disabled={!connected}
          onPress={() => apply('Potência', () => reader.setPower(power))}
        />
      </Card>

      <Card
        title="Região / frequência"
        right={<Badge text={frequencyLabel(readerInfo.frequencyMode)} />}
      >
        <View style={styles.wrap}>
          {FREQUENCY_MODES.map(f => (
            <Button
              key={f.code}
              title={f.label}
              variant={
                readerInfo.frequencyMode === f.code ? 'primary' : 'secondary'
              }
              disabled={!connected}
              onPress={() =>
                apply('Região', () => reader.setFrequencyMode(f.code))
              }
            />
          ))}
        </View>
      </Card>

      <Card title="Leitura">
        <Toggle
          label="Incluir TID no inventário"
          value={settings.includeTid}
          onChange={v => {
            updateSettings({ includeTid: v });
            if (connected) {
              reader.setInventoryMode(v).catch(() => undefined);
            }
          }}
        />
        <Toggle
          label="Bip do leitor"
          value={beep}
          onChange={v => {
            setBeep(v);
            if (connected) {
              reader.setBeep(v).catch(() => undefined);
            }
          }}
        />
        <Button
          title="Restaurar padrões de fábrica (UHF)"
          variant="danger"
          disabled={!connected}
          onPress={async () => {
            if (
              await confirm('Reset', 'Restaurar parâmetros UHF de fábrica?')
            ) {
              apply('Reset', () => reader.factoryReset());
            }
          }}
        />
      </Card>
    </>
  );
}
