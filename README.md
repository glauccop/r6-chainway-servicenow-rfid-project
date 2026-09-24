# NowRFID

App RFID UHF (leitor Chainway R6, via BLE) + código de barras/QR Code, integrado ao ServiceNow para apoiar o cadastramento de ativos no módulo EAM (Enterprise Asset Management).

Veja o plano completo em [`docs/PLAN.md`](docs/PLAN.md).

## Estrutura planejada

- `android-app/` — app "NowRFID" em React Native + TypeScript, com módulo nativo Kotlin (bridge) para o SDK Chainway.
- `servicenow-app/` — app escopado ServiceNow "NowRFID" (Fluent / Now SDK): tabelas de staging + Scripted REST API.
- `docs/` — plano, achados técnicos e roadmap.
