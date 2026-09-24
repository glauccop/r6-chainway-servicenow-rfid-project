# Chainway R6 + SDK — achados técnicos

Consolidação do estudo feito sobre o leitor **Chainway R6 (UHF sled)**, o manual oficial e os SDKs/demos do fabricante (`API_Ver20251103.rar`, `Demo-uhf-ble_as.rar`, `Demo-uhf_as.rar`, `Demo-uhf-ble_xamarin.rar`).

## Hardware (manual `R6 User Manual.pdf`)

| Item | Valor |
|---|---|
| MCU | Cortex‑M3 STM32 72 MHz |
| UHF | EPC C1 Gen2 / ISO18000‑6C, 902‑928 / 865‑868 / 920‑925 MHz |
| Potência | 5 – 30 dBm (1 W), ajustável |
| Alcance / taxa | > 28 m indoor, > 12 m outdoor, > 200 tags/s |
| Imager 2D | SE2707 — 1D, QR, Micro QR, DataMatrix, PDF417, Aztec, MaxiCode, postais |
| Interfaces | Bluetooth (BLE) e Micro‑USB (UART) |
| LEDs | Power, Bluetooth, Work |

## Transporte Bluetooth

- O R6 anuncia via BLE com o nome **`Nordic_UART_CW`** → é o **Nordic UART Service (NUS)**:
  - Service `6E400001-B5A3-F393-E0A9-E50E24DCCA9E`
  - RX (escrita) `6E400002-…`, TX (notify) `6E400003-…`
- O **canal** é genérico e documentado, mas o **protocolo de comandos** dentro dele (inventário, leitura/gravação, lock, kill, config) é **proprietário** e não está documentado. Usar o SDK é o caminho suportado.
- A permissão/serviço `no.nordicsemi.android.*` no demo é usada só para upgrade de firmware (DFU); o SDK não depende dela para operar.

## SDK

| Arquivo | Versão | Observação |
|---|---|---|
| `DeviceAPI_ver20251103_release.aar` | nov/2025 | **a mais recente** — usar esta. Inclui JNI (`arm64-v8a`, `armeabi-v7a`, `armeabi`), minSdk 17 |
| `DeviceAPI_ver20250209_release.aar` | fev/2025 | usada no demo BLE nativo |
| `DeviceAPI_Android.dll` | mar/2024 | binding Xamarin antigo (ChainwayMauiDemo) — descartado |

Javadoc completo em `API_Ver20251103.rar → doc.rar`.

### Fluxo principal (`com.rscja.deviceapi.RFIDWithUHFBLE`)

```java
RFIDWithUHFBLE uhf = RFIDWithUHFBLE.getInstance();
uhf.init(context);
uhf.startScanBTDevices(ScanBTCallback);            // getDevices(BluetoothDevice, rssi, scanRecord)
uhf.stopScanBTDevices();
uhf.connect(mac, ConnectionStatusCallback);        // getStatus(ConnectionStatus.CONNECTED|CONNECTING|DISCONNECTED, device)
uhf.setKeyEventCallback(KeyEventCallback);         // gatilho físico: onKeyDown/onKeyUp
uhf.setInventoryCallback(IUHFInventoryCallback);   // callback(UHFTAGInfo) — substitui readTagFromBufferList (deprecated)
uhf.startInventoryTag();  uhf.stopInventory();
uhf.inventorySingleTag();                          // leitura pontual
uhf.disconnect();  uhf.free();
```

### Leitura, gravação e ferramentas

| Operação | Método |
|---|---|
| Ler banco | `readData(pwd, bank, ptr, cnt)` / com filtro |
| Gravar banco | `writeData(pwd, bank, ptr, cnt, data)` / com filtro, `blockWriteData(...)` |
| Gravar EPC | `writeDataToEpc(pwd, epc)` / com filtro |
| Apagar | `eraseData(pwd, bank, ptr, cnt)` |
| Lock | `generateLockCode(ArrayList<Integer> banks, mode)` + `lockMem(pwd, lockCode)` / com filtro |
| Kill | `killTag(killPwd)` / com filtro (senha 00000000 não mata) |
| Filtro inventário | `setFilter(bank, ptr, cnt, data)` |
| Modo inventário | `setEPCMode()`, `setEPCAndTIDMode()`, `setEPCAndTIDUserMode(ptr, len)` |
| RF | `setPower/getPower`, `setFrequencyMode/getFrequencyMode`, `setRFLink`, `setGen2`, `setFastID`, `setTagFocus` |
| Localizar tag | `startLocation(ctx, epc, Bank_EPC, 32, IUHFLocationCallback)` (0‑100), `stopLocation()` |
| Info | `getVersion()`, `getTemperature()`, `getBattery()`, `getSTM32Version()` |
| Buzzer | `setBeep(bool)`, `triggerBeep(ms)` |
| Barcode/QR | `startScanBarcode()` → `BarcodeResult`, `stopScanBarcode()`, `setBarcodeTypeInSSIID(bool)` |

**Não existe** API de encriptação de zonas em `RFIDWithUHFBLE` nesta versão (aparecia só no demo antigo `demo-uhf-bt 1.0.9`).

### Constantes

- Bancos: `Bank_RESERVED=0`, `Bank_EPC=1`, `Bank_TID=2`, `Bank_USER=3` (ptr/cnt em **words** de 16 bits; EPC começa no ptr 2).
- LockBank: `KILL=16`, `ACCESS=32`, `EPC=48`, `TID=64`, `USER=80`.
- LockMode: `LOCK=16`, `OPEN=32`, `PLOCK=48` (permanente), `POPEN=64`.
- Regiões (`setFrequencyMode`): China1 `0x01`, China2 `0x02`, Europa `0x04`, EUA `0x08`, Coreia `0x16`, Japão `0x32`, África do Sul `0x33`, Taiwan `0x34`, Vietnã `0x35`, Peru `0x36`, Rússia `0x37`, Marrocos `0x80`, Malásia `0x3B`, **Brasil `0x3C`**.

### Dados de uma tag (`UHFTAGInfo`)

`getEPC`, `getTid`, `getUser`, `getReserved`, `getPc`, `getRssi` (string), `getCount`, `getAnt`, `getPhase`, `getFrequencyPoint`, `getTimestamp`, `getEpcBytes/getTidBytes/getUserBytes`, `getChipInfo`.

### Barcode (`BarcodeResult`)

`getBarcodeBytesData()`, `getBarcodeSSIID()`, `getBarcodeCodeID()`, estáticos `getBarcodeTypeBySSIID(int)` / `getBarcodeTypeByCodeId(String)` (ex.: SSIID `0x1C` = QR Code, `0x1B` = Data Matrix, `0x11` = PDF‑417).

Obs.: o pacote `com.rscja.barcode` (`BarcodeDecoder`, `BarcodeFactory`) é para coletores Android com scanner embutido (C66/C72…), **não** para o R6 via BLE.

## Permissões Android (demo BLE oficial)

`BLUETOOTH`/`BLUETOOTH_ADMIN` (maxSdk 30), `BLUETOOTH_SCAN`, `BLUETOOTH_CONNECT`, `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`, `FOREGROUND_SERVICE`.

## Por que não Now Mobile

- As *Native Capabilities* oficiais do Now Mobile são: Phone, Camera (inclui barcode por câmera), Geolocation, Push, Siri Shortcuts. **Não há Bluetooth/BLE.**
- Mobile App Builder é no‑code sobre o app compilado pela ServiceNow; não aceita `.aar` nem plugins nativos.
- Leitores Bluetooth só funcionam no Now Mobile em modo **HID (teclado)** — o que é função do SO, não do app, e não permite inventário, RSSI, gravação, lock/kill.
- O **Mobile SDK** da ServiceNow faz o caminho inverso (embutir ServiceNow num app próprio) — por isso o NowRFID é um app Android próprio.
