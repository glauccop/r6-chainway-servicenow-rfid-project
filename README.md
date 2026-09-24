# NowRFID

Leitura **e gravação** de tags RFID UHF (leitor Chainway R6 via Bluetooth LE), leitura de códigos de barras e QR Code, com envio para o ServiceNow como staging para o cadastramento de ativos no EAM.

| Pasta | Conteúdo |
|---|---|
| [`android-app/`](android-app/README.md) | App Android "NowRFID" — React Native + TypeScript com ponte Kotlin para o SDK Chainway |
| [`servicenow-app/`](servicenow-app/README.md) | App escopado ServiceNow "NowRFID" (Fluent / Now SDK): tabelas de staging, roles/ACLs e Scripted REST API |
| [`docs/`](docs/) | [Plano](docs/PLAN.md), [contrato da API](docs/api-contract.md), [estudo do SDK Chainway](docs/chainway-sdk-findings.md), [modelo de dados EAM](docs/servicenow-eam-datamodel.md), [roadmap](docs/roadmap.md) |

## Fluxo

```
R6 --BLE--> app NowRFID (lote offline) --HTTPS--> /api/x_nowrfid/nowrfid/batch --> Scan Batch / Scan Item
                                                                          (Fase 2: promoção para alm_asset / EAM)
```

## Começando

1. Deploy do app ServiceNow: [`servicenow-app/README.md`](servicenow-app/README.md)
2. Build e instalação do app Android: [`android-app/README.md`](android-app/README.md)
