# NowRFID — app escopado ServiceNow

App Fluent (Now SDK 4.9) que serve de **staging** para as capturas do app Android NowRFID.

- Escopo: `x_nowrfid` · Nome: NowRFID
- API: `/api/x_nowrfid/nowrfid` (`GET /ping`, `POST /batch`) — contrato em [`../docs/api-contract.md`](../docs/api-contract.md)
- Tabelas: `x_nowrfid_scan_batch` (Scan Batch, `RFB0001000…`) e `x_nowrfid_scan_item` (Scan Item)
- Roles: `x_nowrfid.integration` (ler + criar; uso da API) e `x_nowrfid.admin` (CRUD completo; contém integration)
- Menu: **NowRFID › Scan Batches / Scan Items**

## Estrutura

```
src/fluent/tables/        scan-batch.now.ts, scan-item.now.ts
src/fluent/security/      roles.now.ts, acls.now.ts
src/fluent/rest/          nowrfid-api.now.ts
src/fluent/navigation/    menu.now.ts
src/server/batch-service.ts   validação, idempotência, criação do lote/itens
src/server/rest/handlers.ts   rotas ping / batch
src/fluent/generated/keys.ts  gerado pelo build — versionar
```

## Pré‑requisitos

Node 20+ e acesso admin a uma instância (PDI serve).

```bash
cd servicenow-app
npm install
```

## Autenticar

```bash
npx now-sdk auth --add https://<instancia>.service-now.com --type basic --alias nowrfid-dev
npx now-sdk auth --use nowrfid-dev
npx now-sdk auth --list
```

## Build e deploy

```bash
npm run build     # compila e valida
npm run deploy    # instala na instância autenticada
```

## Escopo / vendor prefix

O escopo é `x_nowrfid`. Em instâncias sem permissão de maint, o SDK avisa se o escopo não começa com o vendor prefix da instância (ex.: `x_snc_`, ver propriedade `glide.appcreator.company.code`). Se a instalação for bloqueada:

1. Troque `scope` em `now.config.json` (ex.: `x_snc_nowrfid`) e o prefixo das tabelas, roles e referências em `src/fluent/**` e `src/server/**` (buscar/substituir `x_nowrfid`).
2. Apague `src/fluent/generated/keys.ts` **apenas se o app nunca foi instalado** em nenhuma instância, e rode `npm run build`.
3. No app Android, ajuste o caminho da API em **Configurações** (`/api/<novo_escopo>/nowrfid`).

## Configurar o usuário de integração (após o deploy)

1. **Usuário**: `sys_user` → novo usuário `nowrfid.integration`, marque *Web service access only* se desejar, defina senha.
2. **Role**: atribua `x_nowrfid.integration` (operadores que também revisam lotes: `x_nowrfid.admin`).
3. **OAuth** (recomendado): *System OAuth › Application Registry › New › Create an OAuth API endpoint for external clients*. Anote `client_id`/`client_secret`. O app usa **password grant** em `https://<instancia>.service-now.com/oauth_token.do`. Verifique que o plugin OAuth 2.0 está ativo e `com.snc.platform.security.oauth.is.active = true`.
4. Teste:

```bash
curl -u nowrfid.integration:'<senha>' https://<instancia>.service-now.com/api/x_nowrfid/nowrfid/ping
```

Depois preencha no app Android (Configurações): URL da instância, caminho da API, usuário, senha e (se OAuth) client id/secret.

## Notas

- `GlideRecord` no servidor não aplica ACL, então o serviço consegue atualizar `item_count`/`status` mesmo com o role de integração tendo só read/create.
- `location` / `department` em Scan Batch ficam vazios na Fase 1 (Fase 3 do roadmap).
