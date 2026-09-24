# ServiceNow — modelo de dados EAM relevante ao NowRFID

## Ativos

EAM não tem tabela isolada: usa a espinha do Asset Management.

```
alm_asset
 ├─ alm_hardware          (ITAM / HAM de TI)
 ├─ alm_consumable, alm_license, alm_facility (legado)
 └─ sn_ent_asset          (Enterprise Asset — raiz EAM)
      └─ sn_ent_facility_asset
      (sn_ent_industrial_asset / sn_ent_medical_asset conforme plugin)
```

- Par Asset ↔ CI 1:1: `alm_asset.ci → cmdb_ci` e `cmdb_ci.asset → alm_asset`. Classe CI de facilities: `cmdb_ci_facility_hardware`.
- Campos obrigatórios relevantes em `alm_asset`: `model`, `model_category`, `quantity` — por isso a criação não deve ir crua pela Table API.
- Localização direta no ativo: `location → cmn_location`, `department → cmn_department`, `stockroom → alm_stockroom`, `aisle_space_location → sn_itam_common_aisle_space`.

## Hierarquia física

- `cmn_location` é **uma única tabela auto‑referenciada**: `parent → cmn_location`, `type → cmn_location_type` (Building, Floor, Room, Campus…), `full_name` (caminho completo), `parent_hp1` (caminho hierárquico).
- `cmn_department` é hierarquia paralela (`parent`), **sem** ligação com `cmn_location`. A ligação só existe no registro do ativo.

## RFID nativo

- `alm_asset.rfid_tag → sn_itam_common_rfid_asset` (campos `rfid_tag`, `serial_number`, `status` Matched/Unmatched, zona, lat/long…).
- Staging `sn_itam_common_rfid_stg_asset` + transform "RFID Resource Data"; match por `serial_number`.
- Documentado para a integração **Zebra MotionWorks**; não confirmado que aceita leitores genéricos → **NowRFID usa campo próprio (`epc`) no staging** e reavalia na Fase 5.

## Padrões de API

| Necessidade | Recomendado |
|---|---|
| Ler `cmn_location` / `cmn_department` (seletor no app) | Table API GET (`sysparm_fields`, `sysparm_query=parent=...`), com cache no app |
| Criar registros em lote | **Scripted REST API** (lógica, validação, lote real) ou Import Set + Transform Map |
| Evitar | Table API para create/update (não valida referências/choices, sem lote) |

## Onde o NowRFID entra

O app grava em tabelas **próprias** de staging (`x_nowrfid_scan_batch`, `x_nowrfid_scan_item`). A promoção para `alm_asset`/`sn_ent_asset` é uma etapa administrativa posterior (Fase 2), permitindo revisar, deduplicar e casar com ativos existentes antes de tocar o EAM.

Alternativas de mercado já no Store (avaliar antes de construir além do MVP): CG4 Asset Tracking, AssetTrack for ServiceNow, Mobile Reach.
