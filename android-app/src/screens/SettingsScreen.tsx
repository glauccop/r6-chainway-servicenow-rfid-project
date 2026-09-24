import React, { useState } from 'react';
import { Text } from 'react-native';
import { serviceNow } from '../network/serviceNow';
import { useApp } from '../state/AppState';
import { AuthMode } from '../types';
import {
  Button,
  Card,
  colors,
  Field,
  KeyValue,
  Muted,
  Screen,
  Segmented,
  Toggle,
} from '../ui/components';

export function SettingsScreen() {
  const { settings, updateSettings } = useApp();
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    text: string;
  } | null>(null);

  const patch = (p: Parameters<typeof updateSettings>[0]) => {
    serviceNow.resetAuth();
    updateSettings(p);
  };

  const test = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const { data } = await serviceNow.ping(settings);
      setTestResult({
        ok: true,
        text: `Conectado como ${data.user} (escopo ${data.scope})`,
      });
    } catch (e) {
      setTestResult({
        ok: false,
        text: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Screen>
      <Card title="Instância ServiceNow">
        <Field
          label="URL da instância"
          placeholder="https://minhainstancia.service-now.com"
          value={settings.instanceUrl}
          onChangeText={t => patch({ instanceUrl: t.trim() })}
          keyboardType="url"
        />
        <Field
          label="Caminho da API NowRFID"
          value={settings.apiPath}
          onChangeText={t => patch({ apiPath: t.trim() })}
        />
        <Segmented<AuthMode>
          value={settings.authMode}
          onChange={authMode => patch({ authMode })}
          options={[
            { value: 'basic', label: 'Basic Auth' },
            { value: 'oauth', label: 'OAuth 2.0 (password grant)' },
          ]}
        />
        <Field
          label="Usuário de integração"
          value={settings.username}
          onChangeText={username => patch({ username })}
        />
        <Field
          label="Senha"
          value={settings.password}
          onChangeText={password => patch({ password })}
          secureTextEntry
        />
        {settings.authMode === 'oauth' && (
          <>
            <Field
              label="Client ID (Application Registry)"
              value={settings.clientId}
              onChangeText={clientId => patch({ clientId })}
            />
            <Field
              label="Client Secret"
              value={settings.clientSecret}
              onChangeText={clientSecret => patch({ clientSecret })}
              secureTextEntry
            />
          </>
        )}
        <Button
          title="Testar conexão (GET /ping)"
          busy={testing}
          disabled={!settings.instanceUrl}
          onPress={test}
        />
        {testResult && (
          <Text
            style={{ color: testResult.ok ? colors.success : colors.danger }}
          >
            {testResult.text}
          </Text>
        )}
        <Muted>As credenciais ficam salvas apenas neste aparelho.</Muted>
      </Card>

      <Card title="Diagnóstico">
        <Toggle
          label="Modo debug (aba Debug + log de tudo que é transmitido)"
          value={settings.debugEnabled}
          onChange={debugEnabled => updateSettings({ debugEnabled })}
        />
        <KeyValue k="ID do aparelho" v={settings.installId} />
      </Card>
    </Screen>
  );
}
