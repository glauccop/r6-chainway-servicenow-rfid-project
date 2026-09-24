# Roadmap NowRFID

## Fase 1 — MVP (em construção)

App Android (React Native + TS + bridge Kotlin ao SDK Chainway) com leitura RFID, gravação/encode, lock/kill/erase, config de RF, barcode/QR e console de debug; envio de lotes para o app escopado `x_nowrfid` (staging + Scripted REST API).

## Fase 2 — Reconciliação / promoção para EAM

Ferramenta administrativa no app escopado para casar `Scan Item` com `alm_asset` (ou `sn_ent_asset` / `sn_ent_facility_asset` se o plugin EAM estiver ativo) por EPC, serial ou asset tag, e promover em lote (criar ou atualizar ativos). Campos `match_status` e `matched_asset` já existem no staging. A classe de destino será definida ao confirmar o estado da instância do cliente.

## Fase 3 — Hierarquia de localização no app

Ler `cmn_location` (árvore via `parent`, tipo via `cmn_location_type`) e `cmn_department` pela Table API (GET) com cache offline; o operador escolhe prédio › andar › sala / departamento antes de capturar. O lote passa a enviar `location`/`department` (colunas já existentes em `x_nowrfid_scan_batch`), e a promoção da Fase 2 copia para o ativo.

## Fase 4 — Consulta de ativos a partir do app

Consultar ativos existentes no ServiceNow dentro do app (verificar/vincular antes de enviar). **Avaliar** usar o **ServiceNow Mobile SDK** (`NowData`) — caminho oficial para embutir dados da instância num app próprio — em vez de uma API de leitura própria. Requer bridge nativo adicional no React Native; fazer um spike antes.

## Fase 5 — Modelo nativo de RFID

Validar (teste direto ou caso no Now Support) se `sn_itam_common_rfid_asset` / `alm_asset.rfid_tag` aceita dados de leitores não‑Zebra via API aberta. Se sim, migrar do campo `epc` do staging para o modelo nativo.
