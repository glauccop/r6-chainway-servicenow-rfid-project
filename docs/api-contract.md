# Contrato da API NowRFID

Base: `https://<instancia>.service-now.com/api/x_nowrfid/nowrfid`

Autenticação: OAuth2 (Bearer) ou Basic. O usuário precisa do role **`x_nowrfid.integration`** (ou `x_nowrfid.admin`). Content‑Type `application/json`.

## GET /ping

Verifica conectividade e credenciais.

```json
{ "result": { "ok": true, "user": "nowrfid.integration", "scope": "x_nowrfid", "time": "2026-09-24 21:30:00" } }
```

## POST /batch

Cria um lote e seus itens. **Idempotente** por `batch.client_batch_id`: reenviar o mesmo lote retorna `200` com o lote existente, sem duplicar itens.

### Request

```json
{
  "batch": {
    "client_batch_id": "8a6f2c1e-4b1d-4c7e-9a2b-1f0e5d3c2b1a",
    "device_id": "pixel-7-abc123",
    "reader_mac": "D7:3B:AA:46:B4:E0",
    "captured_at": "2026-09-24T18:30:00Z",
    "app_version": "0.1.0",
    "notes": ""
  },
  "items": [
    {
      "client_item_id": "c1",
      "capture_type": "rfid",
      "operation": "read",
      "epc": "E2004000780600801570752E",
      "tid": "E2003412013AFB00",
      "user_data": "",
      "rssi": "-55.3",
      "read_count": 3,
      "captured_at": "2026-09-24T18:29:58Z",
      "raw_payload": "{\"pc\":\"3000\",\"ant\":\"1\"}"
    },
    {
      "client_item_id": "c2",
      "capture_type": "rfid",
      "operation": "write",
      "epc": "300833B2DDD9014000000001",
      "captured_at": "2026-09-24T18:31:10Z"
    },
    {
      "client_item_id": "c3",
      "capture_type": "qr",
      "operation": "read",
      "barcode_value": "ASSET-000123",
      "symbology": "QR Code",
      "captured_at": "2026-09-24T18:32:00Z"
    }
  ]
}
```

| Campo | Regras |
|---|---|
| `batch.client_batch_id` | obrigatório, único (UUID gerado no app) |
| `items` | array não vazio |
| `capture_type` | `rfid` \| `barcode` \| `qr` |
| `operation` | `read` (ativo escaneado) \| `write` (tag gravada/criada); padrão `read` |
| `epc` | obrigatório quando `capture_type=rfid` (hex, gravado em maiúsculas) |
| `barcode_value` | obrigatório quando `barcode`/`qr` |
| datas | ISO‑8601 (`Z` ou offset), convertidas para UTC |
| `raw_payload` | string (ou objeto, serializado) até 4000 chars |

### Respostas (dentro de `result`)

- `201` criado:
  ```json
  { "batch_sys_id": "…", "batch_number": "RFB0001000", "items_created": 3, "duplicate": false, "errors": [] }
  ```
- `200` lote já existia (`duplicate: true`).
- `400` validação: `{ "errors": [], "error": "items must be a non-empty array" }`.
- Itens inválidos não derrubam o lote: aparecem em `errors[]` com `client_item_id` e `message`. Se nenhum item for criado, o lote fica com `status=error`.

## Exemplos curl

```bash
BASE=https://<instancia>.service-now.com/api/x_nowrfid/nowrfid

# Token OAuth (password grant)
TOKEN=$(curl -s -X POST https://<instancia>.service-now.com/oauth_token.do \
  -d grant_type=password -d client_id=$CLIENT_ID -d client_secret=$CLIENT_SECRET \
  -d username=nowrfid.integration -d password="$PASS" | jq -r .access_token)

curl -s $BASE/ping -H "Authorization: Bearer $TOKEN"

curl -s -X POST $BASE/batch \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d @exemplo-lote.json

# Alternativa Basic (dev)
curl -s -u nowrfid.integration:"$PASS" $BASE/ping
```
