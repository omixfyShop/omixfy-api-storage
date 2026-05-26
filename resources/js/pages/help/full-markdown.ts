export const FULL_MARKDOWN = `# Omixfy CDN — Documentação da API

Base URL: \`https://cdn.omixfy.com\`

## Autenticação

Todas as requisições à API precisam de um token. Há 3 formas de enviá-lo:

\`\`\`bash
# 1. Header Authorization (recomendado)
curl -H "Authorization: Bearer SEU_TOKEN" https://cdn.omixfy.com/api/assets/list

# 2. Header customizado
curl -H "X-AssetsMe-Token: SEU_TOKEN" https://cdn.omixfy.com/api/assets/list

# 3. Query parameter
curl "https://cdn.omixfy.com/api/assets/list?token=SEU_TOKEN"
\`\`\`

---

## Upload de Arquivos

### Endpoint

\`POST /api/assets/upload\`

### Query Parameters

| Param    | Tipo   | Descrição |
|----------|--------|-----------|
| folder   | string | Caminho da pasta de destino (ex: \`produtos/fotos\`) |
| small    | string | Gerar variante small (\`1\` para padrão ou \`LARGURAxALTURA\`) |
| medium   | string | Gerar variante medium (\`1\` para padrão ou \`LARGURAxALTURA\`) |
| large    | string | Gerar variante large (\`1\` para padrão ou \`LARGURAxALTURA\`) |

### Body

Multipart form-data com \`file\` (único) ou \`files[]\` (múltiplo).

### Exemplo com cURL

\`\`\`bash
curl -X POST "https://cdn.omixfy.com/api/assets/upload?folder=minha-pasta&small=1&medium=1&large=1" \\
  -H "Authorization: Bearer SEU_TOKEN" \\
  -F "file=@imagem.jpg"
\`\`\`

### Exemplo com JavaScript (fetch)

\`\`\`javascript
const formData = new FormData();
formData.append('file', file);

const response = await fetch(
  'https://cdn.omixfy.com/api/assets/upload?folder=minha-pasta&small=1&medium=1',
  {
    method: 'POST',
    headers: { 'Authorization': 'Bearer SEU_TOKEN' },
    body: formData,
  }
);

const data = await response.json();
\`\`\`

### Exemplo com Axios (Node.js)

\`\`\`javascript
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

const form = new FormData();
form.append('file', fs.createReadStream('./imagem.jpg'));

const { data } = await axios.post(
  'https://cdn.omixfy.com/api/assets/upload?folder=minha-pasta&small=1&medium=1&large=1',
  form,
  {
    headers: {
      'Authorization': 'Bearer SEU_TOKEN',
      ...form.getHeaders(),
    },
  }
);
\`\`\`

### Resposta

\`\`\`json
{
  "id": "01J...",
  "path": "minha-pasta/imagem.jpg",
  "url": "https://cdn.omixfy.com/assets/minha-pasta/imagem.jpg",
  "mime": "image/jpeg",
  "size": 204800,
  "generated_thumbs": {
    "small": { "url": "https://cdn.omixfy.com/assets/minha-pasta/small/imagem.jpg", "path": "..." },
    "medium": { "url": "https://cdn.omixfy.com/assets/minha-pasta/medium/imagem.jpg", "path": "..." },
    "large": { "url": "https://cdn.omixfy.com/assets/minha-pasta/large/imagem.jpg", "path": "..." }
  }
}
\`\`\`

### Upload múltiplo

\`\`\`bash
curl -X POST "https://cdn.omixfy.com/api/assets/upload?folder=banners" \\
  -H "Authorization: Bearer SEU_TOKEN" \\
  -F "files[]=@foto1.jpg" \\
  -F "files[]=@foto2.png" \\
  -F "files[]=@foto3.webp"
\`\`\`

---

## Acessar Assets

Os assets são servidos publicamente, sem autenticação.

### URLs

\`\`\`
# Original
https://cdn.omixfy.com/assets/{caminho-do-arquivo}

# Variantes (thumbnails)
https://cdn.omixfy.com/assets/{pasta}/small/{arquivo}
https://cdn.omixfy.com/assets/{pasta}/medium/{arquivo}
https://cdn.omixfy.com/assets/{pasta}/large/{arquivo}
\`\`\`

### Exemplo em HTML

\`\`\`html
<img src="https://cdn.omixfy.com/assets/produtos/foto.jpg" alt="Produto" />

<!-- Com srcset para responsividade -->
<img
  src="https://cdn.omixfy.com/assets/produtos/medium/foto.jpg"
  srcset="
    https://cdn.omixfy.com/assets/produtos/small/foto.jpg 300w,
    https://cdn.omixfy.com/assets/produtos/medium/foto.jpg 600w,
    https://cdn.omixfy.com/assets/produtos/large/foto.jpg 1200w
  "
  sizes="(max-width: 600px) 300px, (max-width: 1024px) 600px, 1200px"
  alt="Produto"
/>
\`\`\`

### Listar assets de uma pasta

\`GET /api/assets/list\`

\`\`\`javascript
const response = await fetch(
  'https://cdn.omixfy.com/api/assets/list?folder=minha-pasta&page=1&per_page=25',
  { headers: { 'Authorization': 'Bearer SEU_TOKEN' } }
);

const { data, meta } = await response.json();
// data: array de assets com path, mime, size, url, generated_thumbs
// meta: { current_page, per_page, next_page_url, prev_page_url }
\`\`\`

### Renomear asset

\`PATCH /api/assets/rename\`

\`\`\`javascript
await fetch('https://cdn.omixfy.com/api/assets/rename', {
  method: 'PATCH',
  headers: {
    'Authorization': 'Bearer SEU_TOKEN',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ path: 'pasta/antigo.jpg', name: 'novo.jpg' }),
});
\`\`\`

### Deletar asset

\`DELETE /api/assets/file\`

\`\`\`javascript
await fetch('https://cdn.omixfy.com/api/assets/file?path=pasta/arquivo.jpg', {
  method: 'DELETE',
  headers: { 'Authorization': 'Bearer SEU_TOKEN' },
});
\`\`\`

---

## Gerenciar Pastas

### Listar pastas raiz

\`GET /api/v1/folders\`

| Param    | Tipo   | Descrição |
|----------|--------|-----------|
| page     | number | Página (default: 1) |
| per_page | number | Itens por página (default: 30, max: 100) |
| orderBy  | string | Campo de ordenação: \`name\`, \`created_at\`, \`updated_at\` |
| order    | string | Direção: \`asc\` ou \`desc\` |
| q        | string | Busca por nome |

\`\`\`javascript
const response = await fetch(
  'https://cdn.omixfy.com/api/v1/folders?page=1&per_page=30&orderBy=name&order=asc',
  { headers: { 'Authorization': 'Bearer SEU_TOKEN' } }
);
const { data, meta } = await response.json();
\`\`\`

### Criar pasta

\`POST /api/v1/folders\`

\`\`\`javascript
await fetch('https://cdn.omixfy.com/api/v1/folders', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer SEU_TOKEN',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'Nova Pasta',
    parent_id: null, // null para raiz, ou ID da pasta pai
  }),
});
\`\`\`

### Ver conteúdo de uma pasta

\`GET /api/v1/folders/{id}/children\`

Retorna subpastas e assets com paginação independente.

| Param        | Tipo   | Descrição |
|--------------|--------|-----------|
| folders_page | number | Página das subpastas |
| assets_page  | number | Página dos assets |
| per_page     | number | Itens por página |
| orderBy      | string | Ordenação |
| order        | string | Direção |

\`\`\`javascript
const folderId = 349;
const response = await fetch(
  \\\`https://cdn.omixfy.com/api/v1/folders/\\\${folderId}/children?per_page=30&folders_page=1&assets_page=1\\\`,
  { headers: { 'Authorization': 'Bearer SEU_TOKEN' } }
);

const { folders, assets } = await response.json();
// folders.data, folders.meta (paginação de subpastas)
// assets.data, assets.meta (paginação de assets)
\`\`\`

### Renomear pasta

\`PATCH /api/v1/folders/{id}\`

\`\`\`javascript
await fetch(\\\`https://cdn.omixfy.com/api/v1/folders/\\\${folderId}\\\`, {
  method: 'PATCH',
  headers: {
    'Authorization': 'Bearer SEU_TOKEN',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ name: 'Novo Nome' }),
});
\`\`\`

### Mover pasta

\`POST /api/v1/folders/{id}/move\`

\`\`\`javascript
await fetch(\\\`https://cdn.omixfy.com/api/v1/folders/\\\${folderId}/move\\\`, {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer SEU_TOKEN',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ parent_id: 5 }), // null para mover para raiz
});
\`\`\`

### Deletar / Restaurar pasta

\`\`\`javascript
// Deletar (soft delete)
await fetch(\\\`https://cdn.omixfy.com/api/v1/folders/\\\${folderId}\\\`, {
  method: 'DELETE',
  headers: { 'Authorization': 'Bearer SEU_TOKEN' },
});

// Restaurar
await fetch(\\\`https://cdn.omixfy.com/api/v1/folders/\\\${folderId}/restore\\\`, {
  method: 'POST',
  headers: { 'Authorization': 'Bearer SEU_TOKEN' },
});
\`\`\`

---

## Tokens de Pasta

Tokens de pasta dão acesso restrito a uma pasta específica sem expor o token principal.

\`POST /api/v1/folders/{id}/tokens\`

\`\`\`javascript
const { data } = await fetch(
  \\\`https://cdn.omixfy.com/api/v1/folders/\\\${folderId}/tokens\\\`,
  {
    method: 'POST',
    headers: { 'Authorization': 'Bearer SEU_TOKEN_PRINCIPAL' },
  }
).then(r => r.json());

// data: { id, token, can_create_subfolders, can_upload, expires_at }
\`\`\`

---

## Health Check

\`GET /api/health\` — Não requer autenticação.

\`\`\`json
{ "ok": true }
\`\`\`
`;
