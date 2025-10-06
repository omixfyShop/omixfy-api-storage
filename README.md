# AssetsMe

AssetsMe é um gerenciador de arquivos estáticos construído com Laravel 11, Inertia e React. Ele oferece uma API autenticada via token fixo para upload, listagem e remoção de assets, além de um painel administrativo para operadores autenticados.


Roadmap: https://assetsme.featurebase.app/en/roadmap

## Requisitos

- PHP 8.2+
- Composer 2+
- Node.js 20+
- NPM 10+
- Extensão PHP `fileinfo`
- SQLite (padrão) ou outro banco compatível configurado no `.env`

## Instalação

1. Clone o repositório e acesse a pasta do projeto:

   ```bash
   git clone https://github.com/sua-organizacao/assetsme.git
   cd assetsme
   ```

2. Instale as dependências PHP e JavaScript:

   ```bash
   composer install
   npm install
   ```

## Configuração inicial

1. Copie o arquivo de ambiente e gere a chave da aplicação:

   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

2. Ajuste os valores a seguir no `.env` (consulte os comentários em `.env.example` para mais detalhes):

   - `ASSETS_DISK`: disco Laravel utilizado para armazenar os arquivos (padrão `assets`).
   - `ASSETS_BASE_URL`: URL pública base para servir os arquivos em `public/assets`.
   - `ASSETS_MAX_FILE_SIZE`: limite de upload em bytes (padrão 10 MB).
   - `VITE_API_URL`: endereço base para o cliente React alcançar a API (ex.: `http://localhost:8000`).
   - `VITE_ASSETSME_TOKEN`: token utilizado pelo painel para enviar requisições à API (defina com um token gerado no menu **Tokens** do painel).
   - `REGISTRATION_DEV_ALWAYS_OPEN` (opcional): defina como `true` para manter o formulário de cadastro público liberado em ambientes de desenvolvimento.

3. Execute as migrações do banco:

   ```bash
   php artisan migrate
   ```

4. Garanta que a pasta pública de assets exista (já criada por padrão) e mantenha o `.htaccess` versionado para cache agressivo e bloqueio de execução PHP:

   ```bash
   mkdir -p public/assets
   ```

## Executando em desenvolvimento

1. Inicie o servidor Laravel em um terminal:

   ```bash
   php artisan serve
   ```

2. Em outro terminal, execute o Vite para o front-end React:

   ```bash
   npm run dev
   ```

A aplicação estará disponível em `http://localhost:8000` com assets acessíveis diretamente via `http://localhost:8000/assets/...`.

Se preferir executar tudo em um único terminal, utilize o pacote `concurrently` já instalado:

```bash
npm install -g concurrently # opcional caso deseje rodar globalmente
concurrently "php artisan serve" "npm run dev"
```

## Build e execução em produção

1. Gere os assets otimizados:

   ```bash
   npm run build
   ```

2. Execute as migrações com flag `--force` e configure o servidor web de sua preferência apontando para `public/`:

   ```bash
   php artisan migrate --force
   php artisan config:cache
   php artisan route:cache
   php artisan view:cache
   ```

3. Certifique-se de configurar o cron/queue se necessário e mantenha a pasta `public/assets` acessível para o servidor HTTP.

## Testes

- Testes de unidade/feature PHP:

  ```bash
  php artisan test
  # ou
  ./vendor/bin/phpunit
  ```

- Verificação do front-end:

  ```bash
  npm run lint
  npm run types
  npm run build
  ```

## Tokens fixos

Os endpoints da API exigem tokens permanentes vinculados a um usuário. Cada token é único, não expira e pode ser revogado a
qualquer momento.

### Criando tokens pelo painel

1. Autentique-se no painel e abra o menu **Tokens**.
2. Clique em **Criar token**, informe um nome opcional e confirme.
3. O token gerado será exibido apenas uma vez em um modal. Copie-o imediatamente e armazene com segurança.
4. Utilize a coluna "Prévia" para identificar tokens existentes e remova-os quando não forem mais necessários.

### Criando tokens via CLI

```
php artisan assetsme:token {user} {--name=}
```

- `{user}` aceita o ID numérico ou o e-mail do usuário.
- `--name=` define um rótulo opcional para facilitar a identificação do token.

Exemplo:

```
php artisan assetsme:token admin@example.com --name="Integração CI"
```

### Utilizando tokens na API

Os tokens podem ser informados de três maneiras:

- Header `Authorization: Bearer <TOKEN>`.
- Header `X-AssetsMe-Token: <TOKEN>`.
- Query string `?token=<TOKEN>` (fallback útil para integrações simples).

Defina uma variável de ambiente temporária e reutilize nos exemplos abaixo:

```bash
TOKEN="seu-token-copiado"
```

Os arquivos publicados continuam acessíveis diretamente pela URL pública (ex.: `https://seu-dominio.com/assets/banner.jpg`) sem
qualquer verificação de token.

## API HTTP

Todas as rotas ficam sob `/api` e exigem um token válido (veja "Tokens fixos"). Utilize `Authorization: Bearer $TOKEN`,
`X-AssetsMe-Token: $TOKEN` ou o query param `?token=$TOKEN`, exceto no health check.

### Health check

```http
GET /api/health
Response: { "ok": true }
```

### Upload de arquivos

```bash
curl -X POST "http://localhost:8000/api/assets/upload?folder=produtos/2025" \
  -H "Authorization: Bearer $TOKEN" \
  -F "files[]=@/caminho/foto1.png" \
  -F "files[]=@/caminho/foto2.jpg"
```

- Parâmetro opcional `folder` sanitizado por regex (`^[a-zA-Z0-9/_-]+$`).
- `files[]` aceita múltiplos arquivos (máximo configurável via `ASSETS_MAX_FILE_SIZE`).
- A resposta retorna metadados: URL pública, caminho, MIME detectado por `finfo`, tamanho, nome original e checksum SHA-256.

### Listagem de assets

```bash
curl -X GET "http://localhost:8000/api/assets/list?folder=produtos/2025" \
  -H "Authorization: Bearer $TOKEN"
```

- Suporta `page` e `per_page` (máximo 100) para paginação simples.
- Quando `folder` é omitido, retorna arquivos da raiz.

### Remoção de arquivo

```bash
curl -X DELETE "http://localhost:8000/api/assets/file?path=produtos/2025/foto1.png" \
  -H "Authorization: Bearer $TOKEN"
```

- Remove o arquivo físico em `public/assets` e o registro na tabela `assets`.
- Paths inválidos retornam HTTP 400. Arquivos inexistentes retornam HTTP 404.

## Painel administrativo

O painel utiliza autenticação padrão do Laravel Breeze. Após realizar login:

- **Upload** (`/assets/upload`): interface com drag-and-drop, seleção de pasta, barra de progresso e retorno das URLs com botão "Copiar".
- **Listagem** (`/assets/list`): tabela com filtro por pasta, paginação, botões de copiar URL e remover asset.
- **Tokens** (`/tokens`): listagem dos tokens vinculados ao usuário, criação de novos tokens (exibidos uma única vez) e exclusão segura.
- **Usuários** (`/admin/users`): disponível apenas para o usuário master. Permite habilitar/desabilitar o cadastro público, criar usuários manualmente (com geração opcional de senha) e visualizar quem é o master.

O primeiro usuário criado na plataforma é marcado automaticamente como **master**. Após esse cadastro inicial, o registro público é desabilitado até que o master o reative manualmente. Você pode reabrir ou encerrar o cadastro a qualquer momento pelo painel em **Usuários → Habilitar cadastro** ou persistindo o valor em `settings.registration_enabled` via seeders/migrations.

As chamadas ao backend são feitas via `fetch` utilizando `Authorization: Bearer ${import.meta.env.VITE_ASSETSME_TOKEN}`. Configure esta variável com um token criado no menu **Tokens**; ele não é exibido na interface.

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

## Deploy via FTPS (GitHub Actions)

O repositório possui um workflow (`.github/workflows/deploy-ftp.yml`) que constrói a aplicação (Composer + Vite) e publica os artefatos via FTPS utilizando a ação `SamKirkland/FTP-Deploy-Action`. O deploy é incremental e preserva o `.env` remoto.

### Secrets necessários

Configure em **Actions → Secrets and variables → Actions**:

- `FTP_SERVER`: endereço do servidor (ex.: `ftp.seudominio.com`).
- `FTP_USERNAME`: usuário com permissão de escrita no `public_html`.
- `FTP_PASSWORD`: senha do usuário FTP.
- `FTP_SERVER_DIR`: diretório remoto de destino (ex.: `/public_html`).
- `FTP_PORT` (opcional): porta FTPS, padrão `21`.

### Checklist da primeira publicação

- [ ] Criar manualmente `public_html/assetsme/.env` no servidor com `APP_KEY` e demais configurações reais.
- [ ] Garantir permissões de escrita para o processo web em `public_html/assetsme/storage/` e `public_html/assetsme/bootstrap/cache/`.
- [ ] Confirmar que existe um `index.php` de ponte em `public_html/` apontando para `assetsme/public/index.php` (gerado pelo workflow).
- [ ] Fazer `git push origin main` para disparar o workflow de deploy.
- [ ] Executar migrações manualmente via SSH ou hPanel sempre que necessário (FTPS não executa comandos).

O workflow compila as dependências PHP (sem `--dev`), gera os assets com Vite, envia o conteúdo preparado em `deploy/` para `${FTP_SERVER_DIR}` e nunca sincroniza o `.env` local, mantendo o arquivo remoto intacto.

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
