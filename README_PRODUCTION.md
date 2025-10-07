# AssetsMe - Guia de Produção e Deploy

Este documento contém informações sobre como fazer build, deploy e configurar o AssetsMe em ambientes de produção.

> 📖 **Documentação de desenvolvimento:** Veja [README.md](README.md) para informações sobre instalação e execução local.



## Índice

- [Build de Produção](#build-de-produção)
- [Deploy Manual](#deploy-manual)
- [Deploy via FTPS (GitHub Actions)](#deploy-via-ftps-github-actions)
- [Comandos de Build](#comandos-de-build)
- [Considerações de Segurança](#considerações-de-segurança)

## Build de Produção

### 1. Preparar o ambiente

Certifique-se de ter um arquivo `.env.production` ou `.env` configurado com as variáveis de produção:

⚠️ Atenção: Nunca exponha chaves ou credenciais sensíveis (como APP_KEY, tokens ou senhas) em repositórios públicos ou arquivos versionados. Mantenha essas informações apenas em ambientes seguros e privados.

```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://seu-dominio.com

# Banco de dados de produção
DB_CONNECTION=mysql
DB_HOST=seu-host-mysql
DB_PORT=3306
DB_DATABASE=assetsme_prod
DB_USERNAME=seu_usuario
DB_PASSWORD=sua_senha_segura

# URLs públicas
ASSETS_BASE_URL=https://seu-dominio.com/assets
VITE_API_URL=https://seu-dominio.com
```

### 2. Gerar a chave da aplicação

```bash
php artisan key:generate
```

### 3. Build dos assets do frontend

```bash
npm run build
```

Ou com SSR (Server-Side Rendering):

```bash
npm run build:ssr
```

### 4. Otimizar o Laravel

Execute os comandos de cache para melhor performance:

```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### 5. Executar migrações

```bash
php artisan migrate --force
```

**Importante:** A flag `--force` é necessária em ambiente de produção.

## Deploy Manual

### Configuração do servidor web

1. **DocumentRoot:** Configure o servidor web (Apache/Nginx) para apontar para a raiz da hospedagem.



### Estrutura de diretórios

```
/var/www/assetsme/
├── app/
├── bootstrap/
├── config/
├── database/
├── public/          ← DocumentRoot deve apontar aqui
│   ├── assets/      ← Arquivos públicos dos usuários
│   ├── build/       ← Assets compilados do Vite
│   └── index.php
├── resources/
├── routes/
├── storage/
└── .env
```

### Apache (.htaccess)

O projeto já inclui `.htaccess` em `public/` e `public/assets/`. Certifique-se de que o Apache tenha `AllowOverride All` habilitado.

### Nginx

Exemplo de configuração Nginx:

```nginx
server {
    listen 80;
    server_name seu-dominio.com;
    root /var/www/assetsme/public;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    index index.php;

    charset utf-8;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }

    # Cache para assets públicos
    location /assets {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /build {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Variáveis de ambiente importantes

Configure no `.env` de produção:

- `APP_ENV=production`
- `APP_DEBUG=false`
- `APP_URL`: URL completa do site
- `ASSETS_BASE_URL`: URL pública dos assets
- `VITE_API_URL`: URL da API para o frontend
- `VITE_ASSETSME_TOKEN`: Token para o painel administrativo
- `DB_*`: Credenciais do banco de dados

## Deploy via FTPS (GitHub Actions)

O projeto inclui um workflow automatizado para deploy via FTPS usando GitHub Actions.

### Configuração do Workflow

O arquivo `.github/workflows/deploy-ftp.yml` realiza automaticamente:

1. ✅ Checkout do código
2. ✅ Instalação de dependências PHP (sem `--dev`)
3. ✅ Instalação de dependências Node.js
4. ✅ Build dos assets com Vite
5. ✅ Preparação da estrutura de diretórios
6. ✅ Upload via FTPS para o servidor
7. ✅ Preservação do `.env` remoto

### Secrets necessários no GitHub

Configure em **Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Descrição | Exemplo |
|--------|-----------|---------|
| `FTP_SERVER` | Endereço do servidor FTP/FTPS | `ftp.seudominio.com` |
| `FTP_USERNAME` | Usuário com permissão de escrita | `usuario@seudominio.com` |
| `FTP_PASSWORD` | Senha do usuário FTP | `sua-senha-segura` |
| `FTP_PORT` | Porta FTPS (opcional) | `21` (padrão) |
| `DEPLOY_HOOK_TOKEN` | Token para webhook de deploy (GERE UM TOKEN ALEATÓRIO) | Token personalizado |
| `SITE_BASE_URL` | URL pública do site | `https://seu-dominio.com` |

### Checklist da primeira publicação

Antes de fazer o primeiro deploy automatizado:


#### 1. Criar arquivo .env no servidor

Crie manualmente o arquivo `.env` no servidor com as configurações de produção:

```bash
# Via FTP/SFTP ou painel de controle, criar:
# /public_html/assetsme/.env

APP_NAME="AssetsMe"
APP_ENV=production
APP_KEY=base64:sua-chave-gerada
APP_DEBUG=false
APP_URL=https://seu-dominio.com

# ... demais configurações
```

**Importante:** O workflow **não** sincroniza o `.env` local, preservando o arquivo remoto.


### Triggers do workflow

O deploy é disparado automaticamente em:

- ✅ Push para a branch `main`
- ✅ Manualmente via **Actions → Deploy to FTP → Run workflow**

### Deploy incremental

O workflow usa `SamKirkland/FTP-Deploy-Action` que realiza deploy incremental:

- ✅ Apenas arquivos modificados são enviados
- ✅ Cache entre deploys para maior velocidade
- ✅ Exclusão automática de arquivos removidos do repositório
- ✅ Preservação de arquivos listados em `.git-ftp-ignore`

### Arquivos excluídos do deploy

O workflow automaticamente exclui:

- `node_modules/`
- `.git/`
- `.env` (local)
- `.env.example`
- `tests/`
- Arquivos de desenvolvimento
- `README*.md`

## Comandos de Build

### Resumo de comandos de produção

```bash
# Build completo
npm run build

# Build com SSR
npm run build:ssr

# Otimizar Laravel
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Executar migrações
php artisan migrate --force

# Limpar caches (se necessário)
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
```


### 2. Proteção de arquivos

O `.htaccess` em `public/assets/` já implementa:

- ✅ Bloqueio de execução de PHP
- ✅ Bloqueio de listagem de diretórios
- ✅ Cache agressivo (1 ano)
- ✅ Headers de segurança
- ✅ Valida MIME types usando `finfo`
- ✅ Bloqueia arquivos PHP
- ✅ Sanitiza nomes de arquivos e pastas
- ✅ Bloqueia path traversal (`..`)
- ✅ Gera checksums SHA-256



## Suporte

Para mais informações:

- 📖 [README.md](README.md) - Documentação de desenvolvimento
- 🐛 [Issues no GitHub](https://github.com/raulmelo/assetsme/issues)
- 🗺️ [Roadmap](https://assetsme.featurebase.app/en/roadmap)

---


