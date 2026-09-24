# NowRFID — App Android (React Native) + ServiceNow Staging App para EAM

## Context

Depois do estudo de viabilidade (concluído: Now Mobile é inviável para RFID UHF; caminho correto é app Android + API ServiceNow), o usuário forneceu o repositório de destino (`https://github.com/glauccop/r6-chainway-servicenow-rfid-project.git`, atualmente vazio) e pediu para organizar todo o material já levantado e começar a construir o app, chamado **`NowRFID`** (esse é também o nome do app escopado do lado ServiceNow).

Cenário de negócio: o app lê RFID UHF (leitor Chainway R6, via BLE), código de barras e QR Code (mesmo leitor R6, mesmo SDK/conexão), e envia os dados para o ServiceNow para apoiar o cadastramento de ativos no módulo **EAM (Enterprise Asset Management)**.

Decisões já tomadas com o usuário nesta sessão:
1. **Stack do app Android: React Native + TypeScript**, com um módulo nativo Kotlin fino embaixo (bridge) envolvendo o SDK Chainway (`RFIDWithUHFBLE`, `.aar` mais recente nov/2025) e expondo métodos/eventos para o lado JS. O lado ServiceNow **não** usa React — fica em Scripted REST API + tabelas + list views tradicionais (não existe "React puro" nativo na plataforma; o equivalente seria UI Builder/Now Experience, descartado por ora).
2. **O ServiceNow não deve ser escrito direto em `alm_asset`/EAM.** Em vez disso, criamos um **app escopado próprio no ServiceNow (NowRFID)** que funciona como camada de staging: recebe os lotes de captura do app Android, guarda os dados brutos, e (numa fase seguinte) permite que um administrador faça a reconciliação/promoção em lote para `alm_asset` ou para as classes do EAM (`sn_ent_asset`), buscando informações em ambos.
3. **Campo de RFID: customizado simples** (ex.: `epc`), não o modelo nativo `alm_asset.rfid_tag → sn_itam_common_rfid_asset` (esse é acoplado ao conector Zebra MotionWorks e não está confirmado que aceita dados de leitores genéricos via API aberta — reavaliar depois).
4. Hierarquia de localização (`cmn_location`/`cmn_department`) e busca de ativos existentes a partir do app **ficam no roadmap**, não no MVP.
5. **O app cobre as duas pontas do ciclo de vida da tag, não só leitura:** (a) **gravação/encode** — escrever um EPC numa tag RFID nova para "criar" a identidade dela e associá-la a um ativo; (b) **leitura/scan** — ler tags/códigos já existentes para inventariar/cadastrar ativos. O usuário pediu explicitamente para incluir, desde o MVP, todas as capacidades que o SDK do R6 já oferece hoje (não só inventário de leitura): gravação de EPC, e como o mesmo SDK já expõe Lock/Kill/Encryption/Configuração de RF, essas ferramentas avançadas de tag também entram no app (não dependem do lado ServiceNow, são operações locais no rádio).

## Arquitetura (visão geral)

```
[R6 Sled] --BLE (RFIDWithUHFBLE, via módulo nativo Kotlin)--> [App "NowRFID" (React Native + TS)]
                                          |  captura RFID + Barcode/QR, guarda local (offline-first)
                                          |  revisão do lote pelo operador
                                          v
                              POST /api/.../rfid_capture/batch  (OAuth2)
                                          v
                     [App escopado ServiceNow "NowRFID": staging]
                        - Scan Batch (lote)
                        - Scan Item (cada leitura: epc/barcode/qr)
                                          |
                                          v  (Fase 2 — não neste MVP)
                     Reconciliação/promoção em lote -> alm_asset / EAM (sn_ent_asset)
```

## Fase 1 — MVP (o que este plano executa)

### 1. Estrutura do repositório (`r6-chainway-servicenow-rfid-project`)
```
android-app/            # app "NowRFID" em React Native + TypeScript
  android/              # projeto Android nativo gerado pelo RN (Gradle) — aqui vive o módulo bridge Kotlin
servicenow-app/         # app escopado ServiceNow "NowRFID" (Fluent / Now SDK, código-fonte versionável)
docs/
  chainway-sdk-findings.md      # consolida o estudo do SDK Chainway (RFIDWithUHFBLE, UHFTAGInfo, BarcodeResult, versões)
  servicenow-eam-datamodel.md   # consolida o estudo do modelo EAM/alm_asset/cmn_location
  roadmap.md                    # fases futuras (abaixo)
README.md
```
Migrar para `docs/` os achados já obtidos nesta sessão (SDK Chainway e modelo de dados ServiceNow), como referência viva do projeto.

### 2. App Android — `android-app/` (React Native + TypeScript)
- Projeto React Native (TypeScript) padrão. `.aar` mais recente da Chainway (`DeviceAPI_ver20251103_release.aar`, já extraído em `/private/tmp/.../scratchpad/chainway-sdk/api-latest/`) vendorizado em `android/app/libs/`.
- **Módulo nativo bridge** (`android/app/src/main/java/.../ChainwayRfidModule.kt`): um `NativeModule` fino que encapsula `RFIDWithUHFBLE.getInstance()`, cobrindo todo o conjunto de operações já confirmado no SDK/manual do R6:
  - Conexão: `init`, `startScanBTDevices`/`connect`/`disconnect`.
  - **Leitura (scan/inventário):** `startInventoryTag`/`stopInventory` + loop de polling `readTagFromBufferList()`; `inventorySingleTag()` para leitura pontual de uma única tag (usado também no fluxo de gravação, para localizar a tag alvo antes de escrever).
  - **Gravação/encode:** `writeData`/`blockWriteData` (grava EPC/USER bank) — fluxo de "criar" uma tag associando-a a um ativo.
  - **Ferramentas avançadas de tag** (mesma SDK, expostas na Fase 1 por pedido explícito do usuário — "todas as habilidades hoje possível"): `lockMem`/`generateLockCode` (lock), `killTag` (kill), encriptação de zonas (USER/EPC), `eraseData`, e configuração de RF (`getPower`/potência, região/frequência, `getRFLink`).
  - **Barcode/QR:** `startScanBarcode`/`stopScanBarcode` (mesma conexão BLE).
  - Expõe `@ReactMethod`s (`connect`, `startInventory`, `writeTag`, `lockTag`, `killTag`, `startBarcodeScan`, etc.) e emite eventos (`onTagRead`, `onTagWritten`, `onBarcodeRead`, `onConnectionStatus`) via `DeviceEventEmitterModule` para o lado JS.
- `AndroidManifest.xml` (dentro de `android/app/`): permissões `BLUETOOTH_SCAN`, `BLUETOOTH_CONNECT`, `ACCESS_FINE_LOCATION`, `FOREGROUND_SERVICE`.
- Lado JS/TS (`src/`): hook `useChainwayReader()` consumindo o `NativeEventEmitter` do módulo; modelo local (`ScanBatch`/`ScanItem`) persistido com `AsyncStorage`/SQLite (offline-first, permite revisar/excluir itens antes de enviar e reenviar em caso de falha de rede); telas (React Navigation):
  - **Conectar** (parear R6).
  - **Capturar/Escanear** — leitura RFID (inventário) + Barcode/QR no mesmo fluxo, para o caso de uso "ativo escaneado".
  - **Gravar Tag** — fluxo dedicado para o caso de uso "tag sendo criada": ler a tag alvo (`inventorySingleTag`), definir/gerar o EPC, escrever, confirmar por releitura.
  - **Ferramentas Avançadas** — Lock/Kill/Encriptação/Configuração de RF (espelha as abas do demo oficial da Chainway: Config, Encryption, Read/Write, Lock, Kill).
  - **Revisar Lote** — lista de itens (lidos ou gravados) antes de enviar.
  - **Configurações** (URL da instância + credenciais) — inclui o toggle de Debug (abaixo).
  - **Debug/Console** (toggle, ligado por padrão nesta fase inicial de testes; pode ser escondido ou virar um item de menu discreto depois): tela que mostra em tempo real tudo que está sendo transmitido — eventos brutos do módulo nativo (bytes/payload de cada leitura, gravação, mudança de status de conexão) e cada request/response HTTP trocado com o ServiceNow (payload enviado, status code, corpo da resposta). Implementado como um logger simples (buffer em memória, lista cronológica reversa) alimentado por (a) um listener que captura todo evento do `NativeEventEmitter` antes de qualquer parsing, e (b) um interceptor na camada `src/network/` que loga toda chamada HTTP. Inclui botão de limpar e de copiar/exportar o log (útil para depurar em campo).
- Camada `src/network/`: cliente HTTP (`fetch`/`axios`), autenticação OAuth2 (token cache), `POST` do lote para o Scripted REST API do ServiceNow.

### 3. App escopado ServiceNow — `servicenow-app/` (Fluent / Now SDK, `npx @servicenow/sdk`)
- Tabela **Scan Batch**: `device_id`, `operator` (reference a `sys_user`), `captured_at`, `status` (New/Sent/Processed), `location`/`department` (deixar os campos já criados, vazios/opcionais na Fase 1 para não precisar de migração depois).
- Tabela **Scan Item**: referência ao batch, `capture_type` (choice: RFID/Barcode/QR), `operation` (choice: Read/Write — distingue "ativo escaneado" de "tag criada/gravada"), `epc` (string, campo customizado simples), `barcode_value`, `symbology`, `rssi`, `raw_payload`, `match_status` (Unmatched/Matched/Created — usado na Fase 2).
- **Scripted REST API** (`POST /api/<scope>/rfid_capture/batch`): recebe o payload do app (batch + array de items, cada item já marcado como Read ou Write), grava nas duas tabelas, valida payload, autenticação via OAuth2 (usuário de integração dedicado).
- ACLs restritas: leitura/escrita das tabelas de staging só para o role de integração e para admins.

### 4. Verificação
- Android: build Gradle, testar com o R6 físico — pareamento BLE, leitura de tags RFID (inventário), **gravação de EPC numa tag e releitura para confirmar**, lock/kill/encriptação em tag de teste, leitura de barcode/QR, revisão do lote, envio.
- ServiceNow: deploy do app Fluent numa instância de dev (`now-sdk`), testar o Scripted REST API via `curl`/Postman antes de testar a partir do app, confirmar que os registros aparecem em Scan Batch/Scan Item com o campo `operation` correto (Read vs Write).
- Ponta a ponta: escanear um lote misto (RFID lido + RFID gravado + QR), enviar, confirmar no ServiceNow.

## Roadmap (fases futuras — não implementadas neste plano)

- **Fase 2 — Reconciliação/promoção para EAM:** ferramenta administrativa no app escopado ServiceNow para buscar/casar `Scan Item` contra `alm_asset` (ou `sn_ent_asset`/`sn_ent_facility_asset` se o plugin EAM estiver ativo na instância do cliente) por serial/asset tag, e promover em lote (criar ou atualizar ativos reais) — decisão de qual classe usar fica para quando confirmarmos o estado da instância do cliente.
- **Fase 3 — Hierarquia de localização no app:** expor `cmn_location`/`cmn_department` via GET (Table API é adequado para leitura) para o app Android popular um seletor de prédio/andar/sala/departamento; o lote passa a carregar esses campos, e a promoção da Fase 2 os copia para o ativo criado.
- **Fase 4 — Busca de ativos a partir do app:** complemento no app NowRFID para consultar ativos já existentes no ServiceNow (somente leitura), permitindo ao operador verificar ou vincular uma leitura a um ativo já cadastrado antes de enviar. **A avaliar:** em vez de construir uma API de leitura própria, usar o **ServiceNow Mobile SDK** (módulo `NowData`) — identificado no estudo de viabilidade original como o caminho oficial da ServiceNow para embutir consulta/mutação de dados da instância dentro de um app nativo próprio do cliente (React Native precisaria de um bridge nativo adicional para esse SDK, já que ele é distribuído para iOS/Android nativo). Vale um spike dedicado antes de comprometer a abordagem.
- **Fase 5 — Revisitar modelo nativo de RFID:** avaliar (com teste direto ou caso no Now Support) se `sn_itam_common_rfid_asset`/`alm_asset.rfid_tag` aceita dados de leitores não-Zebra via API aberta; se sim, migrar do campo customizado `epc` para esse modelo nativo.
