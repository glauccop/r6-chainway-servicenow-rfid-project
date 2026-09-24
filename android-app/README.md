# NowRFID — app Android (React Native + TypeScript)

App de campo para o leitor **Chainway R6** (sled UHF via Bluetooth LE): lê e grava tags RFID, lê códigos de barras e QR Code pelo imager do próprio R6, monta lotes offline e envia ao app escopado **NowRFID** no ServiceNow.

## Funcionalidades

| Aba | O que faz |
|---|---|
| **Conectar** | Busca o R6 por BLE (`Nordic_UART_CW`), conecta, reconecta ao último, mostra bateria/versão/temperatura/potência/região |
| **Escanear** | Inventário RFID contínuo ou leitura única; barcode/QR pelo imager do R6; gatilho físico dispara o modo ativo; leituras repetidas são agrupadas por EPC |
| **Gravar** | "Tag sendo criada": lê a tag alvo, grava novo EPC (ou gera um de 96 bits), USER bank opcional, lock opcional, confirma por releitura e adiciona ao lote como `write` |
| **Ferram.** | Memória (ler/gravar/apagar qualquer banco), Lock/Unlock/Perma-lock, Kill, Localizar tag (proximidade 0–100), Config RF (potência 5–30 dBm, região/frequência, TID no inventário, bip, reset) |
| **Lote** | Revisar/remover itens, observações, enviar ao ServiceNow, histórico de lotes enviados |
| **Config** | Instância, caminho da API, Basic Auth ou OAuth 2.0 (password grant), teste `GET /ping`, liga/desliga debug |
| **Debug** | Tudo que trafega em tempo real: cada comando ao SDK e sua resposta, eventos brutos do leitor e cada request/response HTTP (credenciais mascaradas). Filtrar, limpar, compartilhar |

Os lotes ficam salvos no aparelho até o envio ser confirmado; reenvios não duplicam no ServiceNow (idempotência por `client_batch_id`).

## Arquitetura

```
specs/NativeChainwayRfid.ts        contrato TurboModule (codegen)
android/app/libs/DeviceAPI_ver20251103_release.aar   SDK Chainway
android/app/src/main/java/com/nowrfid/ChainwayRfidModule.kt   ponte Kotlin -> RFIDWithUHFBLE
src/reader/chainway.ts             API tipada + eventos + constantes (bancos, lock, regiões)
src/state/AppState.tsx             estado, lote, merge de leituras, envio
src/network/serviceNow.ts          cliente REST (Basic/OAuth) com log no Debug
src/debug/debugLog.ts              buffer do console de debug
src/screens/*                      telas
```

Todas as chamadas ao SDK rodam numa fila única fora da thread JS (o rádio atende um comando por vez). Tags do inventário são agrupadas e enviadas ao JS a cada 150 ms.

## Pré-requisitos para compilar

- Node 22+
- **JDK 17** (ex.: `brew install --cask zulu@17`)
- **Android SDK** (Android Studio) com SDK Platform 36/37 e Build-Tools; defina `ANDROID_HOME`
- Celular Android 8.1+ com Bluetooth LE (o SDK Chainway traz libs nativas arm64-v8a/armeabi-v7a — não roda em emulador x86)

## Rodar

```bash
npm install
npx react-native run-android          # debug, com Metro
# ou APK:
cd android && ./gradlew assembleRelease   # android/app/build/outputs/apk/release/
```

> O build release usa a keystore de debug do template. Gere uma keystore própria antes de distribuir.

## Checks

```bash
npm run typecheck
npm test
npm run lint
```

## Primeiro teste em campo

1. **Config**: URL da instância + usuário com a role `x_nowrfid.integration` → *Testar conexão*.
2. **Conectar**: ligue o R6, *Buscar*, toque em `Nordic_UART_CW`.
3. **Ferram. › Config RF**: selecione a região **Brasil** (ou a do local) e a potência.
4. **Escanear** algumas tags e um QR Code; **Gravar** uma tag de teste.
5. **Lote › Enviar**. Acompanhe tudo na aba **Debug** e confira em *NowRFID › Scan Batches* na instância.
