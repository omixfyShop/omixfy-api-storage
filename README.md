# AssetsMe

AssetsMe é um gerenciador de arquivos estáticos construído com Laravel 11, Inertia e React. Ele oferece uma API autenticada via token fixo para upload, listagem e remoção de assets, além de um painel administrativo para operadores autenticados.

## Requisitos

- PHP 8.2+
- Composer 2+
- Node.js 20+
- NPM 10+
- Extensão PHP `fileinfo`
- SQLite (padrão) ou outro banco compatível configurado no `.env`

## Configuração do projeto

1. Instale as dependências PHP e JavaScript:

   ```bash
   composer install
   npm install
   ```

2. Copie o arquivo de ambiente e gere a chave da aplicação:

   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

3. Ajuste os valores a seguir no `.env`:

   - `ASSETSME_TOKEN`: token fixo de 64 caracteres usado pela API e pelo painel.
   - `ASSETS_DISK`: disco Laravel utilizado para armazenar os arquivos (padrão `assets`).
   - `ASSETS_BASE_URL`: URL pública base para servir os arquivos em `public/assets`.
   - `ASSETS_MAX_FILE_SIZE`: limite de upload em bytes (padrão 10 MB).
   - `VITE_API_BASE_URL`: endereço base para o cliente React alcançar a API (ex.: `http://localhost`).
   - `VITE_ASSETSME_TOKEN`: token utilizado pelo painel para enviar requisições à API (use o mesmo do backend).

4. Execute as migrações do banco:

   ```bash
   php artisan migrate
   ```

5. Garanta que a pasta pública de assets exista (já criada por padrão) e mantenha o `.htaccess` versionado para cache agressivo e bloqueio de execução PHP:

   ```bash
   mkdir -p public/assets
   ```

6. Suba os servidores de desenvolvimento em terminais separados:

   ```bash
   php artisan serve
   npm run dev
   ```

A aplicação estará disponível em `http://localhost:8000` com assets acessíveis diretamente via `http://localhost:8000/assets/...`.

## API HTTP

Todas as rotas ficam sob `/api` e exigem o header `Authorization: Bearer <ASSETSME_TOKEN>`, exceto o health check.

### Health check

```http
GET /api/health
Response: { "ok": true }
```

### Upload de arquivos

```bash
curl -X POST "http://localhost:8000/api/assets/upload?folder=produtos/2025" \
  -H "Authorization: Bearer $ASSETSME_TOKEN" \
  -F "files[]=@/caminho/foto1.png" \
  -F "files[]=@/caminho/foto2.jpg"
```

- Parâmetro opcional `folder` sanitizado por regex (`^[a-zA-Z0-9/_-]+$`).
- `files[]` aceita múltiplos arquivos (máximo configurável via `ASSETS_MAX_FILE_SIZE`).
- A resposta retorna metadados: URL pública, caminho, MIME detectado por `finfo`, tamanho, nome original e checksum SHA-256.

### Listagem de assets

```bash
curl -X GET "http://localhost:8000/api/assets/list?folder=produtos/2025" \
  -H "Authorization: Bearer $ASSETSME_TOKEN"
```

- Suporta `page` e `per_page` (máximo 100) para paginação simples.
- Quando `folder` é omitido, retorna arquivos da raiz.

### Remoção de arquivo

```bash
curl -X DELETE "http://localhost:8000/api/assets/file?path=produtos/2025/foto1.png" \
  -H "Authorization: Bearer $ASSETSME_TOKEN"
```

- Remove o arquivo físico em `public/assets` e o registro na tabela `assets`.
- Paths inválidos retornam HTTP 400. Arquivos inexistentes retornam HTTP 404.

## Painel administrativo

O painel utiliza autenticação padrão do Laravel Breeze. Após realizar login:

- **Upload** (`/assets/upload`): interface com drag-and-drop, seleção de pasta, barra de progresso e retorno das URLs com botão "Copiar".
- **Listagem** (`/assets/list`): tabela com filtro por pasta, paginação, botões de copiar URL e remover asset.

As chamadas ao backend são feitas via `fetch` utilizando `Authorization: Bearer ${import.meta.env.VITE_ASSETSME_TOKEN}`. O token não é exibido na interface.

## Segurança e cache

- Middleware `token` garante autenticação por token fixo em todas as rotas da API.
- Sanitização de nomes de pastas e arquivos com bloqueio de `..`.
- Verificação de MIME real com `finfo` e bloqueio de conteúdo PHP.
- `public/assets/.htaccess` aplica `Options -Indexes`, bloqueio de execução PHP e cache forte (`Cache-Control: public, max-age=31536000, immutable`).
- URLs públicas são servidas diretamente em `/assets/...` sem expor detalhes de implementação Laravel.

## Deploy

- Configure o `DocumentRoot` do servidor para apontar para a pasta `public/` do projeto.
- Certifique-se de publicar o `.htaccess` de `public/assets`.
- Ajuste `APP_URL`, `ASSETS_BASE_URL` e tokens nas variáveis de ambiente do servidor.
- Para ambientes compartilhados (Apache), mantenha as regras de cache e bloqueio de execução PHP para evitar upload de scripts maliciosos.

## Comandos úteis

```bash
# Executa a suíte de testes PHP
php artisan test

# Checa tipos do front-end
npm run types
```

## Estrutura de dados

Tabela `assets`:

| Campo         | Tipo     | Descrição                                         |
|---------------|----------|---------------------------------------------------|
| id            | UUID     | Identificador único                               |
| path          | string   | Caminho relativo dentro de `public/assets`        |
| folder        | string   | Pasta sanitizada (indexada)                       |
| original_name | string   | Nome original do upload                           |
| mime          | string   | MIME detectado via `finfo`                        |
| size          | bigint   | Tamanho em bytes                                  |
| checksum      | string   | SHA-256 do arquivo (opcional)                     |
| uploaded_by   | integer  | Referência opcional ao usuário autenticado        |
| timestamps    | datetime | Datas de criação/atualização                      |

Pronto! Configure o `.env`, rode as migrações e comece a gerenciar seus assets com segurança.
